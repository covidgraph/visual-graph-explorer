import {
  DefaultGraph,
  IEdge,
  IGraph,
  INode,
  IEdgeStyle,
  GraphComponent,
  Size,
  INodeStyle,
  Rect,
  Point,
  License,
  OrganicLayout,
} from "yfiles";

import licenseData from "../../yfiles-license.json";

License.value = licenseData;

import coreQuery from "./dbconnection";
import { getId, isOfType } from "./Neo4jGraphBuilder";

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

const limit = 200;

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
    this.layout = new OrganicLayout({
      minimumNodeDistance: 100,
      starSubstructureStyle: "separated-radial",
      parallelSubstructureStyle: "radial",
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
   * Retrieves the schema object that created the given item.
   * @param item
   * @return {INode|IEdge|null}
   */
  getSchemaObject(item) {
    if (item && item.tag && item.tag.schemaType >= 0)
      return this.queryBuilder.schemaGraph.nodes
        .concat(this.queryBuilder.schemaGraph.edges)
        .firstOrDefault(
          (graphItem) => graphItem.tag.schemaType === item.tag.schemaType
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
          .map((schemaEdge) => ({
            action: () => this.loadOutEdges(item, schemaEdge),
            title: `Load ${schemaEdge.tag.relatedVerb} ${schemaEdge.targetNode.tag.pluralName}`,
          }))
          .concat(
            this.queryBuilder.schemaGraph
              .inEdgesAt(schemaNode)
              .map((schemaEdge) => ({
                action: () => this.loadInEdges(item, schemaEdge),
                title: `Load ${schemaEdge.tag.relatingVerb} ${schemaEdge.sourceNode.tag.pluralName}`,
              }))
          )
      )
      .toArray();
  }

  /**
   * @param {Object[]} items
   * @return {{action: (function(): *), title: string}[]}
   */
  findCommonActions(items) {
    return this.queryBuilder.schemaGraph.nodes
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
      .toArray();
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
                  targetNode = this.getLoadedNode(targetItem);
                  if (!targetNode) {
                    targetNode = nodeCreator(targetItem, location);
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

  async loadAndConnectSchemaTargets(
    items,
    schemaEdge,
    nodeCreator,
    edgeCreator
  ) {
    let nodes = items
      .map((item) => this.getLoadedNode(item))
      .filter((item) => !!item);
    let newItems = [];
    if (nodes.length > 0) {
      let location = nodes[0].layout.center.toPoint();
      let graph = this.graphComponent.graph;
      (await this.queryBuilder.loadCommonTargets(schemaEdge, items)).forEach(
        (item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            nodes.forEach((node) => {
              if (!graph.getEdge(node, existingNode)) {
                edgeCreator(item, node, existingNode);
              }
            });
          } else {
            newItems.push(item);
            let newNode = nodeCreator(item, location);
            nodes.forEach((node) => {
              if (!graph.getEdge(node, newNode)) {
                edgeCreator(item, node, newNode);
              }
            });
          }
        }
      );
    }
    return newItems;
  }

  async loadAndConnectSchemaSources(
    items,
    schemaEdge,
    nodeCreator,
    edgeCreator
  ) {
    let nodes = items
      .map((item) => this.getLoadedNode(item))
      .filter((item) => !!item);
    let newItems = [];
    if (nodes.length > 0) {
      let location = nodes[0].layout.center.toPoint();
      let graph = this.graphComponent.graph;
      (await this.queryBuilder.loadCommonSources(schemaEdge, items)).forEach(
        (item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            nodes.forEach((node) => {
              if (!graph.getEdge(existingNode, node)) {
                edgeCreator(item, existingNode, node);
              }
            });
          } else {
            newItems.push(item);
            let newNode = nodeCreator(item, location);
            nodes.forEach((node) => {
              if (!graph.getEdge(newNode, node)) {
                edgeCreator(item, newNode, node);
              }
            });
          }
        }
      );
    }
    return newItems;
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
        schemaEdge.tag.creator
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
        schemaEdge.tag.creator
      );
      await this.loadMissingEdgesForSchemaNodes(
        schemaEdge.sourceNode,
        newItems
      );
    });
  }

  async runLayout() {
    await this.graphComponent.morphLayout(this.layout);
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

  /** @param {INode} schemaNode
   * @param {string[]} whereClauses
   */
  createLoadNodesQuery(schemaNode, whereClauses) {
    return `MATCH (node:${schemaNode.tag.nodeLabels.join(
      ":"
    )}) WHERE ${whereClauses.join(
      " AND "
    )} RETURN distinct(node) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createOutEdgeQuery(schemaEdge) {
    return `MATCH (sourceNode:${schemaEdge.sourceNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(targetNode) as targetNode,relation LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createTargetNodesQuery(schemaEdge) {
    return `MATCH (sourceNode:${schemaEdge.sourceNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(targetNode) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createSourceNodesQuery(schemaEdge) {
    return `MATCH (targetNode:${schemaEdge.targetNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(sourceNode) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createInEdgeQuery(schemaEdge) {
    return `MATCH (targetNode:${schemaEdge.targetNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(sourceNode) as sourceNode, relation LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createMissingEdgesQuery(schemaEdge) {
    return `MATCH (sourceNode:${schemaEdge.sourceNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(sourceNode) in $sourceIds MATCH ${
      schemaEdge.tag.matchClause
    } WHERE id(targetNode) in $targetIds RETURN id(sourceNode) as sourceNodeId, id(targetNode) as targetNodeId ${
      schemaEdge.tag.hasRelation ? ",relation " : ""
    } LIMIT ${limit}`;
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
   * @param {IEdge} schemaEdge
   * @param {object[]} sourceObjects
   * @param {object[]} targetObjects
   * @return {Promise<{sourceId:integer, targetId:integer, relation:object?}[]>}
   */
  async loadMissingEdges(schemaEdge, sourceObjects, targetObjects) {
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
