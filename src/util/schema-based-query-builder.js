import {
  ComponentArrangementStyles,
  ComponentLayout,
  DefaultGraph,
  GraphComponent,
  IEdge,
  IEdgeStyle,
  IEnumerable,
  IGraph,
  INode,
  INodeStyle,
  License,
  OrganicLayout,
  OrganicLayoutData,
  Point,
  Rect,
  Size,
} from "yfiles";

import licenseData from "../../yfiles-license.json";
import coreQuery from "./dbconnection";
import { getId, isOfType } from "./Neo4jGraphBuilder";

License.value = licenseData;

/**
 * @param {String} query
 * @param {Object} args
 * @param {String} name?
 * @return {Promise<*[]>}
 */
async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args)).records.map((r) => r.get(name));
}

/**
 *
 * @param {String} query
 * @param {Object} args
 * @param {String[]} names
 * @return {Promise<{}[]>}
 */
async function mapQuery(query, args = {}, names = ["result"]) {
  return (await coreQuery(query, args)).records.map((r) => {
    let result = {};
    for (let i = 0; i < names.length; i++) {
      result[names[i]] = r.get(names[i]);
    }
    return result;
  });
}

// the maximum number of elements fetched from the server for one request
const limit = 250;

/**
 *
 * @param {Object[]} items
 * @param {String} type
 * @return {boolean}
 */
function isMultiSelection(items, type) {
  return items.length > 1 && items.every((item) => isOfType(item, type));
}

/**
 * Determines whether the items *only* consist of *all* of the types -
 * no additional types and at least one of each type
 * @param {Object[]} items
 * @param {String[]} types
 * @return {boolean}
 */
function isMixedSelection(items, types) {
  const typeCounts = types.map(
    (type) => items.filter((item) => isOfType(item, type)).length
  );
  return (
    typeCounts.every((count) => count > 0) &&
    typeCounts.reduce((c1, c2) => c1 + c2, 0) === items.length
  );
}

/**
 * @param {IGraph} graph
 * @param {INode} sourceNode
 * @param {INode} targetNode
 * @param {IEdge} schemaEdge
 * @param relation?
 */
function createRelation(graph, sourceNode, targetNode, schemaEdge, relation) {
  if (schemaEdge.tag.hasRelation) {
    if (
      !graph
        .outEdgesAt(sourceNode)
        .filter((outEdge) => outEdge.targetNode === targetNode)
        .some(
          (existingEdge) =>
            existingEdge.tag.schemaType === schemaEdge.tag.schemaType
        )
    ) {
      schemaEdge.tag.creator(relation, sourceNode, targetNode);
    }
  } else {
    if (!graph.getEdge(sourceNode, targetNode)) {
      schemaEdge.tag.creator({}, sourceNode, targetNode);
    }
  }
}

function select(a, prop) {
  return a.map((item) => item[prop]);
}

/**
 * @param {function[]} actions
 */
function runAll(actions) {
  if (actions && actions.length > 0) {
    actions.forEach((action) => action());
  }
}

/**
 * @typedef {{name: String, query:String, leftEnd:INode, rightEnd:INode, relationShipType:String,      leftRelationShip:IEdge,  rightRelationShip:IEdge,intersectionSchemaNode:INode}} Intersection
 */

export class IncrementalGraphLoader {
  /**
   * @param {GraphComponent} graphComponent
   * @param {SchemaBasedQueryBuilder} queryBuilder
   */
  constructor(queryBuilder, graphComponent) {
    this.queryBuilder = queryBuilder;
    this.graphComponent = graphComponent;
    this.schemaTypeCounter = 0;
    /** @type {Map<any, INode>} */
    this.id2NodeMapping = new Map();
    /** @type {Intersection[]} */
    this.intersections = [];
    this.layout = new OrganicLayout({
      minimumNodeDistance: 100,
      starSubstructureStyle: "separated-radial",
      parallelSubstructureStyle: "radial",
      qualityTimeRatio: 0.7,
    });
    this.layout.componentLayout = new ComponentLayout({
      style:
        ComponentArrangementStyles.MODIFIER_NO_OVERLAP |
        ComponentArrangementStyles.MODIFIER_AS_IS |
        ComponentArrangementStyles.NONE,
    });
  }

  createNodeCreator(style, size, labels) {
    return (item, location) => {
      return this.registerNode(
        this.graphComponent.graph.createNode({
          tag: item,
          layout: Rect.fromCenter(location || Point.ORIGIN, size),
          style: style,
          labels: labels(item),
        }),
        item
      );
    };
  }

  /**
   * @param {IEdgeStyle} style
   * @param {function(item):string[]} labels
   * @return {function(item:Object, source:INode, target:INode):IEdge}
   */
  createEdgeCreator(style, labels) {
    return (item, source, target) => {
      this.graphComponent.graph.createEdge({
        source,
        target,
        style,
        labels: labels(item),
        tag: item,
      });
    };
  }

  /**
   *
   * @param {string} type
   * @param {INodeStyle} style
   * @param {Size} size
   * @param {function(item):string[]} labels
   * @param {string|null} singularName?
   * @param {string|null} pluralName?
   * @param {function(item:object):string} tooltipFunction
   * @return {INode}
   */
  addNodeType({
    type,
    style,
    size,
    labels = null,
    singularName = null,
    pluralName = null,
    tooltipFunction = null,
    metadata = null,
  }) {
    this.schemaTypeCounter++;
    let node = this.queryBuilder.addNodeType(type);
    node.tag.creator = this.wrapCreatorWithSchemaType(
      this.createNodeCreator(style, size, labels || (() => [])),
      this.schemaTypeCounter
    );
    node.tag.type = type;
    node.tag.tooltipFunction = tooltipFunction;
    node.tag.schemaType = this.schemaTypeCounter;
    node.tag.singularName = singularName || type.toLowerCase();
    node.tag.pluralName = pluralName || type.toLowerCase() + "s";
    node.tag.metadata = metadata;
    return node;
  }

  /**
   * Retrieves the schema object that created the given graph item.
   * @param item
   * @return {INode|IEdge|null}
   */
  getSchemaObject(item) {
    if (item && item.tag && item.tag.schemaType >= 0)
      return this.getSchemaObjectForItem(item.tag);
    else return null;
  }

  /**
   * Retrieves the schema object that created the given item.
   * @param item
   * @return {INode|IEdge|null}
   */
  getSchemaObjectForItem(item) {
    if (item.schemaType >= 0)
      return this.queryBuilder.schemaGraph.nodes
        .concat(this.queryBuilder.schemaGraph.edges)
        .firstOrDefault(
          (graphItem) => graphItem.tag.schemaType === item.schemaType
        );
    else return null;
  }

  /**
   * @param {INode} sourceNode
   * @param {INode} targetNode
   * @param {IEdgeStyle} style
   * @param {function(item:object):string[]} labels
   * @param {string|null} matchClause?
   * @param {string|null} relatedVerb?
   * @param {string|null} relatingVerb?
   * @param {function(item:object):string} tooltipFunction
   * @return {IEdge}
   */
  addRelationShip({
    sourceNode,
    targetNode,
    style = null,
    labels = null,
    matchClause = null,
    relatedVerb = null,
    relatingVerb = null,
    tooltipFunction = null,
  }) {
    this.schemaTypeCounter++;
    if (matchClause === null) {
      matchClause = `(sourceNode:${sourceNode.tag.type})-->(targetNode:${targetNode.tag.type})`;
    }
    if (labels === null) {
      labels = () => [];
    }
    let relationShipType = sourceNode.tag.type + "->" + targetNode.tag.type;
    let edge = this.queryBuilder.addRelationShip(
      relationShipType,
      sourceNode,
      targetNode,
      matchClause,
      relatedVerb || "related",
      relatingVerb || "relating"
    );
    edge.tag.schemaType = this.schemaTypeCounter;
    edge.tag.tooltipFunction = tooltipFunction;
    edge.tag.creator = this.wrapCreatorWithSchemaType(
      this.createEdgeCreator(style || edgeStyle, labels),
      this.schemaTypeCounter
    );
    edge.tag.type = relationShipType;
    return edge;
  }

  /**
   * @param {IEdge} relationShip1
   * @param {INode} connectingNode
   * @param {IEdge} relationShip2
   * @param {string} name
   */
  addIntersectionQuery({ relationShip1, connectingNode, relationShip2, name }) {
    let leftEnd =
      relationShip1.targetNode === connectingNode
        ? relationShip1.sourceNode
        : relationShip1.targetNode;
    let rightEnd =
      relationShip2.targetNode === connectingNode
        ? relationShip2.sourceNode
        : relationShip2.targetNode;
    let relationShipType =
      leftEnd.tag.type +
      "--" +
      connectingNode.tag.type +
      "->" +
      rightEnd.tag.type;

    this.intersections.push({
      leftEnd,
      rightEnd,
      relationShipType,
      leftRelationShip: relationShip1,
      rightRelationShip: relationShip2,
      intersectionSchemaNode: connectingNode,
      query: this.queryBuilder.createIntersectionQuery(
        relationShip1,
        leftEnd === relationShip1.targetNode,
        relationShip2,
        rightEnd === relationShip2.sourceNode
      ),
      name,
    });
  }

  /**
   * @template {T}
   * @param {function(item:object, ...):T} creatorFunction
   * @param schemaType
   * @return {function(item:object, ...args):T}
   */
  wrapCreatorWithSchemaType(creatorFunction, schemaType) {
    return function () {
      if (arguments[0]) {
        arguments[0].schemaType = schemaType;
      }
      return creatorFunction.apply(this, arguments);
    };
  }

  /**
   * @param item
   * @return {{action: (function(): *), title: string}[]}
   */
  findActions(item) {
    return this.queryBuilder.schemaGraph.nodes
      .filter((schemaNode) => isOfType(item, schemaNode.tag.type))
      .flatMap((schemaNode) =>
        this.queryBuilder.schemaGraph
          .outEdgesAt(schemaNode)
          .map(this.createLoadOutEdgesAction(item))
          .concat(
            this.queryBuilder.schemaGraph
              .inEdgesAt(schemaNode)
              .map(this.createLoadInEdgesAction(item))
          )
      )
      .toArray();
  }

  createLoadInEdgesAction(item) {
    return (schemaEdge) => {
      const action = {
        action: () => this.loadInEdges(item, schemaEdge),
        title: `Load ${schemaEdge.tag.relatingVerb} ${schemaEdge.sourceNode.tag.pluralName} (?)`,
        disabled: false,
      };
      this.loadInEdgeCount(item, schemaEdge).then((count) => {
        action.title = `Load ${schemaEdge.tag.relatingVerb} ${schemaEdge.sourceNode.tag.pluralName} (${count})`;
        action.disabled = count < 1;
      });
      return action;
    };
  }

  createLoadOutEdgesAction(item) {
    return (schemaEdge) => {
      const action = {
        action: () => this.loadOutEdges(item, schemaEdge),
        title: `Load ${schemaEdge.tag.relatedVerb} ${schemaEdge.targetNode.tag.pluralName} (?)`,
        disabled: false,
      };
      this.loadOutEdgeCount(item, schemaEdge).then((count) => {
        action.title = `Load ${schemaEdge.tag.relatedVerb} ${schemaEdge.targetNode.tag.pluralName} (${count})`;
        action.disabled = count < 1;
      });
      return action;
    };
  }

  /**
   * @param {Object[]} items
   * @return {{action: (function(): *), title: string}[]}
   */
  findCommonActions(items) {
    return this.intersections
      .filter((intersection) =>
        isMixedSelection(items, [
          intersection.leftEnd.tag.type,
          intersection.rightEnd.tag.type,
        ])
      )
      .map((intersection) => {
        return {
          action: () =>
            this.loadIntersection(
              items.filter((item) =>
                isOfType(item, intersection.leftEnd.tag.type)
              ),
              items.filter((item) =>
                isOfType(item, intersection.rightEnd.tag.type)
              ),
              intersection
            ),
          title: "Find " + intersection.name,
        };
      })
      .concat(
        this.queryBuilder.schemaGraph.nodes
          .filter((schemaNode) => isMultiSelection(items, schemaNode.tag.type))
          .flatMap((schemaNode) =>
            this.queryBuilder.schemaGraph
              .outEdgesAt(schemaNode)
              .map((schemaEdge) => ({
                action: () => this.loadCommonTargets(items, schemaEdge),
                title: `Load common ${schemaEdge.tag.relatedVerb} ${schemaEdge.targetNode.tag.pluralName}`,
              }))
              .concat(
                this.queryBuilder.schemaGraph
                  .inEdgesAt(schemaNode)
                  .map((schemaEdge) => ({
                    action: () => this.loadCommonSources(items, schemaEdge),
                    title: `Load common ${schemaEdge.tag.relatingVerb} ${schemaEdge.sourceNode.tag.pluralName}`,
                  }))
              )
          )
          .toArray()
      );
  }

  getMetadata(item) {
    const schemaObject = this.getSchemaObject(item);
    if (schemaObject) {
      return schemaObject.tag.metadata;
    } else {
      return null;
    }
  }

  /**
   *
   * @param {INode} node
   * @param item
   * @return {INode}
   */
  registerNode(node, item) {
    this.id2NodeMapping.set(getId(item.identity), node);
    return node;
  }

  /** @return {INode} */
  getLoadedNode(item) {
    return this.id2NodeMapping.get(getId(item.identity));
  }

  getLoadedItemsOfType(schemaNode) {
    return this.graphComponent.graph.nodes
      .map((n) => n.tag)
      .filter((t) => isOfType(t, schemaNode.tag.type))
      .toArray();
  }

  async loadAndConnectSchemaOutEdges(
    item,
    schemaEdge,
    nodeCreator,
    filterAction = null
  ) {
    const sourceNode = this.getLoadedNode(item);
    let lazyActions = [];
    if (sourceNode) {
      const location = sourceNode.layout.center.toPoint();
      const graph = this.graphComponent.graph;
      const lazyRelations = [];
      if (schemaEdge.tag.hasRelation) {
        (await this.queryBuilder.loadOutEdges(schemaEdge, item)).forEach(
          ({ targetNode: targetItem, relation }) => {
            let targetNode = this.getLoadedNode(targetItem);
            if (!targetNode) {
              lazyActions.push({
                item: targetItem,
                action: () => {
                  targetNode = this.getOrCreateNode(
                    targetItem,
                    nodeCreator,
                    location
                  );
                  createRelation(
                    graph,
                    sourceNode,
                    targetNode,
                    schemaEdge,
                    relation
                  );
                },
              });
            } else {
              lazyRelations.push(() =>
                createRelation(
                  graph,
                  sourceNode,
                  targetNode,
                  schemaEdge,
                  relation
                )
              );
            }
          }
        );
      } else {
        (await this.queryBuilder.loadTargetNodes(schemaEdge, item)).forEach(
          (targetItem) => {
            let targetNode = this.getLoadedNode(targetItem);
            if (!targetNode) {
              lazyActions.push({
                item: targetItem,
                action: () =>
                  createRelation(
                    graph,
                    sourceNode,
                    nodeCreator(targetItem, location),
                    schemaEdge,
                    null
                  ),
              });
            } else {
              lazyRelations.push(() =>
                createRelation(graph, sourceNode, targetNode, schemaEdge, null)
              );
            }
          }
        );
      }
      if (filterAction && lazyActions.length > 0) {
        lazyActions = await filterAction(lazyActions);
      }
      if (lazyActions !== null) {
        runAll(select(lazyActions, "action"));
      }
    }
    return lazyActions !== null ? lazyActions.map((item) => item.item) : [];
  }

  getOrCreateNode(item, nodeCreator, location) {
    let node = this.getLoadedNode(item);
    if (!node) {
      node = nodeCreator(item, location);
    }
    return node;
  }

  async loadAndConnectSchemaTargets(
    items,
    schemaEdge,
    nodeCreator,
    edgeCreator,
    filterAction = null
  ) {
    let sourceNodes = items
      .map((item) => this.getLoadedNode(item))
      .filter((item) => !!item);
    let lazyActions = [];
    if (sourceNodes.length > 0) {
      let location = sourceNodes[0].layout.center.toPoint();
      (await this.queryBuilder.loadCommonTargets(schemaEdge, items)).forEach(
        (targetItem) => {
          let existingTarget = this.getLoadedNode(targetItem);
          if (!existingTarget) {
            lazyActions.push({
              item: targetItem,
              action: () =>
                this.getOrCreateNode(targetItem, nodeCreator, location),
            });
          }
        }
      );
      if (filterAction && lazyActions.length > 0) {
        lazyActions = await filterAction(lazyActions);
      }
      if (lazyActions !== null) {
        runAll(select(lazyActions, "action"));
      }
    }
    return lazyActions !== null ? lazyActions.map((item) => item.item) : [];
  }

  async loadAndConnectSchemaSources(
    items,
    schemaEdge,
    nodeCreator,
    edgeCreator,
    filterAction = null
  ) {
    let targetNodes = items
      .map((item) => this.getLoadedNode(item))
      .filter((item) => !!item);
    let lazyActions = [];
    if (targetNodes.length > 0) {
      let location = targetNodes[0].layout.center.toPoint();
      (await this.queryBuilder.loadCommonSources(schemaEdge, items)).forEach(
        (sourceItem) => {
          let existingSource = this.getLoadedNode(sourceItem);
          if (!existingSource) {
            lazyActions.push({
              item: sourceItem,
              action: () =>
                this.getOrCreateNode(sourceItem, nodeCreator, location),
            });
          }
        }
      );
      if (filterAction && lazyActions.length > 0) {
        lazyActions = await filterAction(lazyActions);
      }
      if (lazyActions !== null) {
        runAll(select(lazyActions, "action"));
      }
    }
    return lazyActions !== null ? lazyActions.map((item) => item.item) : [];
  }

  async loadAndConnectSchemaInEdges(
    item,
    schemaEdge,
    nodeCreator,
    filterAction = null
  ) {
    const targetNode = this.getLoadedNode(item);
    let lazyActions = [];
    if (targetNode) {
      const location = targetNode.layout.center.toPoint();
      const graph = this.graphComponent.graph;
      const lazyRelations = [];
      if (schemaEdge.tag.hasRelation) {
        (await this.queryBuilder.loadInEdges(schemaEdge, item)).forEach(
          ({ sourceNode: targetItem, relation }) => {
            let sourceNode = this.getLoadedNode(targetItem);
            if (!sourceNode) {
              lazyActions.push({
                item: targetItem,
                action: () => {
                  sourceNode = this.getLoadedNode(targetItem);
                  if (!sourceNode) {
                    sourceNode = nodeCreator(targetItem, location);
                  }
                  createRelation(
                    graph,
                    sourceNode,
                    targetNode,
                    schemaEdge,
                    relation
                  );
                },
              });
            } else {
              lazyRelations.push(() =>
                createRelation(
                  graph,
                  sourceNode,
                  targetNode,
                  schemaEdge,
                  relation
                )
              );
            }
          }
        );
      } else {
        (await this.queryBuilder.loadSourceNodes(schemaEdge, item)).forEach(
          (sourceItem) => {
            let sourceNode = this.getLoadedNode(sourceItem);
            if (!sourceNode) {
              lazyActions.push({
                item: sourceItem,
                action: () =>
                  createRelation(
                    graph,
                    nodeCreator(sourceItem, location),
                    targetNode,
                    schemaEdge
                  ),
              });
            } else {
              lazyRelations.push(() =>
                createRelation(graph, sourceNode, targetNode, schemaEdge)
              );
            }
          }
        );
      }
      if (filterAction && lazyActions.length > 0) {
        lazyActions = await filterAction(lazyActions);
      }
      if (lazyActions !== null) {
        runAll(select(lazyActions, "action"));
        runAll(lazyRelations);
      }
    }
    return lazyActions !== null ? lazyActions.map((item) => item.item) : [];
  }

  /**
   * @param {object[]} left
   * @param {object[]} right
   * @param {Intersection} intersection
   * @param {Point} location
   * @return {Promise<INode[]>}
   */
  async loadIntersectionNodes(
    left,
    right,
    intersection,
    location,
    filterAction = null
  ) {
    let newItems = [];
    let lazyActions = [];
    (
      await this.queryBuilder.loadIntersection(intersection, left, right)
    ).forEach(({ intermediateNode }) => {
      let existingNode = this.getLoadedNode(intermediateNode);
      if (!existingNode) {
        lazyActions.push({
          item: intermediateNode,
          action: () => {
            existingNode = this.getLoadedNode(intermediateNode);
            if (!existingNode) {
              existingNode = intersection.intersectionSchemaNode.tag.creator(
                intermediateNode,
                location
              );
              newItems.push(intermediateNode);
            }
          },
        });
      }
    });
    if (filterAction && lazyActions.length > 0) {
      lazyActions = await filterAction(lazyActions);
    }
    if (lazyActions !== null) {
      runAll(select(lazyActions, "action"));
    }
    return newItems;
  }

  remove(items) {
    items
      .slice()
      .map((item) => this.getLoadedNode(item))
      .filter((node) => node != null)
      .forEach((node) => {
        this.graphComponent.graph.remove(node);
        this.id2NodeMapping.delete(getId(node.tag.identity));
      });
  }

  async loadAndLayout(load) {
    const oldElementCounter =
      this.graphComponent.graph.nodes.size +
      this.graphComponent.graph.edges.size;
    const result = await load();
    if (
      this.graphComponent.graph.nodes.size +
        this.graphComponent.graph.edges.size >
      oldElementCounter
    ) {
      await this.runLayout();
    }
    return result;
  }

  clearGraph() {
    this.id2NodeMapping.clear();
    this.graphComponent.graph.clear();
  }

  /** @param {function():Promise<object[]>} loadNodesFunction */
  async loadNodes(loadNodesFunction, creator) {
    return await this.loadAndLayout(async () =>
      (await loadNodesFunction())
        .filter((item) => !this.getLoadedNode(item))
        .forEach((item) => creator(item))
    );
  }

  async loadNodesForSchema(schemaNode, whereClauses, params) {
    return this.loadAndLayout(async () => {
      let nodes = await this.queryBuilder.loadNodes(
        schemaNode,
        whereClauses,
        params
      );
      nodes
        .filter((item) => !this.getLoadedNode(item))
        .forEach((item) => schemaNode.tag.creator(item));
      return nodes;
    });
  }

  async loadNodeForSchema(schemaNode, id) {
    return await this.loadAndLayout(async () => {
      let item = await this.queryBuilder.loadNodeById(schemaNode, id);
      if (item && !this.getLoadedNode(item)) {
        schemaNode.tag.creator(item);
      }
      return item;
    });
  }

  async loadNodeDetails(schemaNode, item) {
    if (schemaNode.tag.metadata && schemaNode.tag.metadata.detailProperties) {
      let details = await this.queryBuilder.loadNodeDetails(
        schemaNode,
        item.identity
      );
      if (details) {
        return { ...item.properties, ...details };
      }
    } else {
      return item.properties;
    }
  }

  async loadAndConnectNodeForSchema(schemaNode, id) {
    return await this.loadAndLayout(async () => {
      let item = await this.queryBuilder.loadNodeById(schemaNode, id);
      if (item && !this.getLoadedNode(item)) {
        schemaNode.tag.creator(item);
        await this.loadMissingEdgesForSchemaNodes(schemaNode, [item]);
      }
      return item;
    });
  }

  /**
   * @param {{sourceId:integer, targetId:integer, relation:object?}[]} missingEdges
   * @param {IEdge} schemaEdge
   */
  createMissingEdges(missingEdges, schemaEdge) {
    let graph = this.graphComponent.graph;
    missingEdges.forEach((missingEdge) => {
      let sourceNode = this.getLoadedNode({
        identity: missingEdge.sourceId,
      });
      let targetNode = this.getLoadedNode({
        identity: missingEdge.targetId,
      });
      createRelation(
        graph,
        sourceNode,
        targetNode,
        schemaEdge,
        missingEdge.relation
      );
    });
  }

  async loadMissingEdgesForSchemaNodes(schemaNode, newItems) {
    if (newItems.length > 0) {
      await Promise.all(
        this.queryBuilder.schemaGraph
          .inEdgesAt(schemaNode)
          .toArray()
          .map(async (schemaEdge) => {
            const missingEdges = await this.queryBuilder.loadMissingEdges(
              schemaEdge,
              this.getLoadedItemsOfType(schemaEdge.sourceNode),
              newItems
            );
            this.createMissingEdges(missingEdges, schemaEdge);
          })
          .concat(
            this.queryBuilder.schemaGraph
              .outEdgesAt(schemaNode)
              .filter((e) => e.targetNode !== schemaNode)
              .toArray()
              .map(async (schemaEdge) => {
                const missingEdges = await this.queryBuilder.loadMissingEdges(
                  schemaEdge,
                  newItems,
                  this.getLoadedItemsOfType(schemaEdge.targetNode)
                );
                this.createMissingEdges(missingEdges, schemaEdge);
              })
          )
      );
    }
  }

  /**
   * @template T
   * @param item
   * @param schemaEdge
   * @return {Promise<void>}
   */
  async loadInEdges(item, schemaEdge) {
    await this.loadAndLayout(async () => {
      const newItems = await this.loadAndConnectSchemaInEdges(
        item,
        schemaEdge,
        schemaEdge.sourceNode.tag.creator,
        schemaEdge.sourceNode.tag.metadata &&
          schemaEdge.sourceNode.tag.metadata.filter
      );
      await this.loadMissingEdgesForSchemaNodes(
        schemaEdge.sourceNode,
        newItems
      );
    });
  }

  getExistingItems(type) {
    return this.graphComponent.graph.nodes.map((node) => node.tag);
  }

  async loadInEdgeCount(item, schemaEdge) {
    const existingItems = this.getExistingItems(schemaEdge.tag.source);
    if (schemaEdge.tag.hasRelation) {
      return await this.queryBuilder.loadInEdgeCount(
        schemaEdge,
        item,
        existingItems
      );
    } else {
      return await this.queryBuilder.loadSourceNodeCount(
        schemaEdge,
        item,
        existingItems
      );
    }
  }

  async loadOutEdgeCount(item, schemaEdge) {
    const existingItems = this.getExistingItems(schemaEdge.tag.target);
    if (schemaEdge.tag.hasRelation) {
      return await this.queryBuilder.loadOutEdgeCount(
        schemaEdge,
        item,
        existingItems
      );
    } else {
      return await this.queryBuilder.loadTargetNodeCount(
        schemaEdge,
        item,
        existingItems
      );
    }
  }

  /**
   * @template T
   * @param item
   * @param schemaEdge
   * @return {Promise<void>}
   */
  async loadOutEdges(item, schemaEdge) {
    await this.loadAndLayout(async () => {
      const newItems = await this.loadAndConnectSchemaOutEdges(
        item,
        schemaEdge,
        schemaEdge.targetNode.tag.creator,
        schemaEdge.targetNode.tag.metadata &&
          schemaEdge.targetNode.tag.metadata.filter
      );
      await this.loadMissingEdgesForSchemaNodes(
        schemaEdge.targetNode,
        newItems
      );
    });
  }

  async loadCommonTargets(items, schemaEdge) {
    await this.loadAndLayout(async () => {
      const newItems = await this.loadAndConnectSchemaTargets(
        items,
        schemaEdge,
        schemaEdge.targetNode.tag.creator,
        schemaEdge.tag.creator,
        schemaEdge.targetNode.tag.metadata &&
          schemaEdge.targetNode.tag.metadata.filter
      );
      await this.loadMissingEdgesForSchemaNodes(
        schemaEdge.targetNode,
        newItems
      );
    });
  }

  async loadCommonSources(items, schemaEdge) {
    await this.loadAndLayout(async () => {
      const newItems = await this.loadAndConnectSchemaSources(
        items,
        schemaEdge,
        schemaEdge.sourceNode.tag.creator,
        schemaEdge.tag.creator,
        schemaEdge.sourceNode.tag.metadata &&
          schemaEdge.sourceNode.tag.metadata.filter
      );
      await this.loadMissingEdgesForSchemaNodes(
        schemaEdge.sourceNode,
        newItems
      );
    });
  }

  /**
   *
   * @param {object[]} left
   * @param {object[]} right
   * @param {Intersection} intersection
   * @return {Promise<void>}
   */
  async loadIntersection(left, right, intersection) {
    /** @type {Point[]} */
    const centers = left
      .concat(right)
      .map((item) => this.getLoadedNode(item))
      .filter((node) => node !== null)
      .map((node) => node.layout.center);
    const centerSum = centers.reduce((c1, c2) => c1.add(c2), Point.ORIGIN);
    const location =
      centers.length > 0 ? centerSum.multiply(1 / centers.length) : null;
    await this.loadAndLayout(async () => {
      const newItems = await this.loadIntersectionNodes(
        left,
        right,
        intersection,
        location,
        intersection.intersectionSchemaNode.tag.metadata &&
          intersection.intersectionSchemaNode.tag.metadata.filter
      );
      await this.loadMissingEdgesForSchemaNodes(
        intersection.intersectionSchemaNode,
        newItems
      );
    });
  }

  async runLayout() {
    await this.graphComponent.morphLayout({
      layout: this.layout,
      layoutData: new OrganicLayoutData({
        sourceGroupIds: (item) => "s" + item.tag.schemaType,
        targetGroupIds: (item) => "t" + item.tag.schemaType,
      }),
    });
  }
}

export default class SchemaBasedQueryBuilder {
  schemaGraph = new DefaultGraph();

  /**
   * @param {String[]|String} labels
   * @return {INode}
   */
  addNodeType(labels) {
    if (!Array.isArray(labels)) {
      labels = [labels];
    }
    return this.schemaGraph.createNode({
      tag: {
        nodeLabels: labels,
      },
    });
  }

  /**
   * @param {String} relationShipType
   * @param {INode} sourceNodeType
   * @param {INode} targetNodeType
   * @param {String} matchClause
   * @param {string} relatedVerb
   * @param {string} relatingVerb
   * @return {IEdge}
   */
  addRelationShip(
    relationShipType,
    sourceNodeType,
    targetNodeType,
    matchClause,
    relatedVerb,
    relatingVerb
  ) {
    let relation = false;
    if (
      matchClause.indexOf("[relation:") > 0 ||
      matchClause.indexOf("(relation:") > 0
    ) {
      relation = true;
    }
    return this.schemaGraph.createEdge({
      source: sourceNodeType,
      target: targetNodeType,
      tag: {
        matchClause,
        hasRelation: relation,
        relationShipType,
        relatedVerb,
        relatingVerb,
      },
    });
  }

  /** @param {INode} schemaNode */
  createNodeMatch(schemaNode) {
    return schemaNode.tag.nodeLabels.join(":");
  }

  /** @param {INode} schemaNode
   * @param {string[]} whereClauses
   */
  createLoadNodesQuery(schemaNode, whereClauses) {
    return `MATCH (node:${this.createNodeMatch(
      schemaNode
    )}) WHERE ${whereClauses.join(
      " AND "
    )} RETURN distinct(node) as result LIMIT ${limit}`;
  }

  createDetailPropertiesBag(detailProperties) {
    return `{${Object.entries(detailProperties)
      .map((entry) => {
        const name = entry[0];
        let query;
        if (typeof entry[1] === "string") {
          query = entry[1];
        } else {
          query = entry[1].tag.matchClause;
        }
        return `${name}: [${query}| targetNode]`;
      })
      .join(",")}}`;
  }

  /** @param {INode} schemaNode
   * @param {string[]} whereClauses
   */
  createLoadNodeDetailsQuery(schemaNode, whereClauses) {
    return `MATCH (node:${this.createNodeMatch(
      schemaNode
    )}) WHERE ${whereClauses.join(
      " AND "
    )} WITH node as sourceNode RETURN sourceNode, ${this.createDetailPropertiesBag(
      schemaNode.tag.metadata.detailProperties
    )} as details LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createOutEdgeQuery(schemaEdge) {
    return `MATCH (sourceNode:${this.createNodeMatch(
      schemaEdge.sourceNode
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(targetNode) as targetNode,relation LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createOutEdgeCountQuery(schemaEdge) {
    return `MATCH (sourceNode:${this.createNodeMatch(
      schemaEdge.sourceNode
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } WITH targetNode MATCH (targetNode) WHERE NOT id(targetNode) in $existingIds RETURN COUNT(DISTINCT(targetNode)) as result`;
  }

  /** @param {IEdge} schemaEdge */
  createTargetNodesQuery(schemaEdge) {
    return `MATCH (sourceNode:${this.createNodeMatch(
      schemaEdge.sourceNode
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(targetNode) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createTargetNodeCountQuery(schemaEdge) {
    return `MATCH (sourceNode:${this.createNodeMatch(
      schemaEdge.sourceNode
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } WITH targetNode MATCH (targetNode) WHERE NOT id(targetNode) in $existingIds RETURN COUNT(DISTINCT(targetNode)) as result`;
  }

  /** @param {IEdge} schemaEdge */
  createSourceNodesQuery(schemaEdge) {
    return `MATCH (targetNode:${this.createNodeMatch(
      schemaEdge.targetNode
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(sourceNode) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createSourceNodeCountQuery(schemaEdge) {
    return `MATCH (targetNode:${this.createNodeMatch(
      schemaEdge.targetNode
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } WITH sourceNode MATCH (sourceNode) WHERE NOT id(sourceNode) in $existingIds RETURN COUNT(DISTINCT(sourceNode)) as result`;
  }

  /** @param {IEdge} schemaEdge */
  createInEdgeQuery(schemaEdge) {
    return `MATCH (targetNode:${this.createNodeMatch(
      schemaEdge.targetNode
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(sourceNode) as sourceNode, relation LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createInEdgeCountQuery(schemaEdge) {
    return `MATCH (targetNode:${this.createNodeMatch(
      schemaEdge.targetNode
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } WITH sourceNode MATCH (sourceNode) WHERE NOT id(sourceNode) in $existingIds RETURN COUNT(DISTINCT(sourceNode)) as result`;
  }

  /** @param {IEdge} schemaEdge */
  createMissingEdgesQuery(schemaEdge) {
    return `MATCH (sourceNode:${this.createNodeMatch(
      schemaEdge.sourceNode
    )}) WHERE id(sourceNode) in $sourceIds MATCH ${
      schemaEdge.tag.matchClause
    } WHERE id(targetNode) in $targetIds RETURN id(sourceNode) as sourceNodeId, id(targetNode) as targetNodeId ${
      schemaEdge.tag.hasRelation ? ",relation " : ""
    } LIMIT ${limit}`;
  }

  /**
   * @param {String} query
   * @param {String} augments
   * @param {String} withClause
   */
  addWith(query, augments, withClause) {
    query = query.replaceAll(
      /\bWITH\b/gi,
      (substring) => "WITH " + augments + ","
    );
    query = query + " WITH " + withClause;
    return query;
  }

  createIntersectionQuery(schemaEdge1, reverse1, schemaEdge2, reverse2) {
    return `MATCH (leftNode:${this.createNodeMatch(
      schemaEdge1.sourceNode
    )}) WHERE id(leftNode) in $leftIds WITH leftNode
    MATCH (rightNode:${this.createNodeMatch(
      schemaEdge2.targetNode
    )}) WHERE id(rightNode) in $rightIds WITH leftNode as ${
      reverse1 ? "targetNode" : "sourceNode"
    }, rightNode
    MATCH ${this.addWith(
      schemaEdge1.tag.matchClause,
      "rightNode",
      `${reverse1 ? "sourceNode" : "targetNode"} as ${
        reverse2 ? "targetNode" : "sourceNode"
      }, rightNode as ${reverse2 ? "sourceNode" : "targetNode"}`
    )}
    MATCH ${schemaEdge2.tag.matchClause} 
    RETURN distinct(${
      reverse2 ? "targetNode" : "sourceNode"
    }) as intermediateNode LIMIT ${limit}`;
  }

  /**
   * @param {{identity:string}} item
   * @param {IEdge} schemaEdge
   */
  async loadTargetNodes(schemaEdge, item) {
    return await query(this.createTargetNodesQuery(schemaEdge), {
      sourceId: item.identity,
    });
  }

  /**
   * @param {{identity:string}} item
   * @param {IEdge} schemaEdge
   * @return {Promise<{targetNode:object,relation:object}[]>}
   */
  async loadOutEdges(schemaEdge, item) {
    return await mapQuery(
      this.createOutEdgeQuery(schemaEdge),
      {
        sourceId: item.identity,
      },
      ["targetNode", "relation"]
    );
  }

  /**
   * @param {{identity:string}} item
   * @param {IEdge} schemaEdge
   * @return {Promise<{sourceNode:object,relation:object}[]>}
   */
  async loadInEdges(schemaEdge, item) {
    return await mapQuery(
      this.createInEdgeQuery(schemaEdge),
      {
        targetId: item.identity,
      },
      ["sourceNode", "relation"]
    );
  }

  async loadInEdgeCount(schemaEdge, item, existingItems) {
    return (
      await query(this.createInEdgeCountQuery(schemaEdge), {
        targetId: item.identity,
        existingIds: existingItems.map((item) => item.identity),
      })
    )[0];
  }

  async loadOutEdgeCount(schemaEdge, item, existingItems) {
    return (
      await query(this.createOutEdgeCountQuery(schemaEdge), {
        sourceId: item.identity,
        existingIds: existingItems.map((item) => item.identity),
      })
    )[0];
  }

  /**
   * @param {{identity:string}[]} items
   * @param {IEdge} schemaEdge
   */
  async loadCommonTargets(schemaEdge, items) {
    let sourceIds = items.map((item) => item.identity);
    let complexQuery = `${sourceIds
      .map(
        (_, i) =>
          `MATCH ${schemaEdge.tag.matchClause} WHERE ${
            i > 0 ? "targetNode in targetList AND" : ""
          } id(sourceNode) = $id[${i}]
      WITH collect(distinct(targetNode)) as targetList`
      )
      .join("\n")}
      RETURN targetList as result`;
    return (
      await query(complexQuery, {
        id: sourceIds,
      })
    )[0];
  }

  /**
   * @param {{identity:string}[]} items
   * @param {IEdge} schemaEdge
   */
  async loadCommonSources(schemaEdge, items) {
    let targetIds = items.map((item) => item.identity);
    let complexQuery = `${targetIds
      .map(
        (_, i) =>
          `MATCH ${schemaEdge.tag.matchClause} WHERE ${
            i > 0 ? "sourceNode in sourceList AND" : ""
          } id(targetNode) = $id[${i}]
      WITH collect(distinct(sourceNode)) as sourceList`
      )
      .join("\n")}
      RETURN sourceList as result`;
    return (
      await query(complexQuery, {
        id: targetIds,
      })
    )[0];
  }

  /**
   * @param {IEdge} schemaEdge
   */
  async loadSourceNodes(schemaEdge, item) {
    return await query(this.createSourceNodesQuery(schemaEdge), {
      targetId: item.identity,
    });
  }

  /**
   * @param {IEdge} schemaEdge
   */
  async loadSourceNodeCount(schemaEdge, item, existingItems) {
    return (
      await query(this.createSourceNodeCountQuery(schemaEdge), {
        targetId: item.identity,
        existingIds: existingItems.map((item) => item.identity),
      })
    )[0];
  }

  /**
   * @param {IEdge} schemaEdge
   */
  async loadTargetNodeCount(schemaEdge, item, existingItems) {
    return (
      await query(this.createTargetNodeCountQuery(schemaEdge), {
        sourceId: item.identity,
        existingIds: existingItems.map((item) => item.identity),
      })
    )[0];
  }

  /**
   * @param {string[]} whereClauses
   * @param {INode} schemaNode
   * @param {{}} params
   */
  async loadNodes(schemaNode, whereClauses, params) {
    return await query(
      this.createLoadNodesQuery(schemaNode, whereClauses),
      params
    );
  }

  /**
   * @param {INode} schemaNode
   */
  async loadNodeById(schemaNode, id) {
    return (
      await query(this.createLoadNodesQuery(schemaNode, ["id(node) = $id"]), {
        id,
      })
    )[0];
  }

  /**
   * @param {INode} schemaNode
   */
  async loadNodeDetails(schemaNode, id) {
    const rawDetails = (
      await mapQuery(
        this.createLoadNodeDetailsQuery(schemaNode, ["id(node) = $id"]),
        {
          id,
        },
        ["sourceNode", "details"]
      )
    )[0].details;
    Object.entries(rawDetails).forEach((entry) => {
      const value = entry[1];
      if (Array.isArray(value)) {
        rawDetails[entry[0]] = IEnumerable.from(value)
          .distinct((arg) => getId(arg.identity))
          .toArray();
      }
    });
    return rawDetails;
  }

  /**
   * @param {object} intersection
   * @param {object[]} left
   * @param {object[]} right
   * @return {Promise<{intermediateNode:object}[]>}
   */
  async loadIntersection(intersection, left, right) {
    return await mapQuery(
      intersection.query,
      {
        leftIds: left.map((item) => item.identity),
        rightIds: right.map((item) => item.identity),
      },
      ["intermediateNode"]
    );
  }

  /**
   * @param {IEdge} schemaEdge
   * @param {object[]} sourceObjects
   * @param {object[]} targetObjects
   * @return {Promise<{sourceId:integer, targetId:integer, relation:object?}[]>}
   */
  async loadMissingEdges(schemaEdge, sourceObjects, targetObjects) {
    if (sourceObjects.length === 0 || targetObjects.length === 0) {
      return [];
    }
    return (
      await coreQuery(this.createMissingEdgesQuery(schemaEdge), {
        sourceIds: sourceObjects.map((item) => item.identity),
        targetIds: targetObjects.map((item) => item.identity),
      })
    ).records.map((r) => ({
      sourceId: r.get("sourceNodeId"),
      relation: schemaEdge.tag.hasRelation ? r.get("relation") : null,
      targetId: r.get("targetNodeId"),
    }));
  }
}
