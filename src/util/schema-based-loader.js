import {
  DefaultGraph,
  IEdge,
  INode,
  GraphComponent,
  Rect,
  Point,
  OrganicLayout,
} from "yfiles";

import coreQuery from "./dbconnection";
import { getId } from "./Neo4jGraphBuilder";
import { isOfType } from "./queries";

async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args)).records.map((r) => r.get(name));
}

const limit = 200;

export class IncrementalGraphLoader {
  /**
   * @param {GraphComponent} graphComponent
   * @param {SchemaBasedLoader} loader
   */
  constructor(loader, graphComponent) {
    this.loader = loader;
    this.graphComponent = graphComponent;
    /** @type {Map<any, INode>} */
    this.id2NodeMapping = new Map();
    this.layout = new OrganicLayout({
      minimumNodeDistance: 100,
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

  addNodeType(type, style, size, labels = null) {
    let node = this.loader.addNodeType(type);
    node.tag.creator = this.createNodeCreator(
      style,
      size,
      labels || (() => [])
    );
    node.tag.type = type;
    return node;
  }

  addRelationShip(
    sourceNode,
    targetNode,
    style = null,
    labels = null,
    matchClause = null
  ) {
    if (matchClause === null) {
      matchClause = `(sourceNode:${sourceNode.tag.type})-->(targetNode:${targetNode.tag.type})`;
    }
    if (labels === null) {
      labels = () => [];
    }
    let relationShipType = sourceNode.tag.type + "->" + targetNode.tag.type;
    let edge = this.loader.addRelationShip(
      relationShipType,
      sourceNode,
      targetNode,
      matchClause
    );
    edge.tag.creator = this.createEdgeCreator(style || edgeStyle, labels);
    edge.tag.type = relationShipType;
    return edge;
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
    edgeCreator
  ) {
    let node = this.getLoadedNode(item);
    let newItems = [];
    if (node) {
      let location = node.layout.center.toPoint();
      let graph = this.graphComponent.graph;
      (await this.loader.loadOutEdges(schemaEdge, item)).forEach((item) => {
        let existingNode = this.getLoadedNode(item);
        if (existingNode) {
          if (!graph.getEdge(node, existingNode)) {
            edgeCreator(item, node, existingNode);
          }
        } else {
          newItems.push(item);
          let newNode = nodeCreator(item, location);
          if (!graph.getEdge(node, newNode)) {
            edgeCreator(item, node, newNode);
          }
        }
      });
      return newItems;
    }
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
      (await this.loader.loadCommonTargets(schemaEdge, items)).forEach(
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
      return newItems;
    }
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
      (await this.loader.loadCommonSources(schemaEdge, items)).forEach(
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
      return newItems;
    }
  }

  async loadAndConnectSchemaInEdges(
    item,
    schemaEdge,
    nodeCreator,
    edgeCreator
  ) {
    let node = this.getLoadedNode(item);
    let newItems = [];
    if (node) {
      let location = node.layout.center.toPoint();
      let graph = this.graphComponent.graph;
      (await this.loader.loadInEdges(schemaEdge, item)).forEach((item) => {
        let existingNode = this.getLoadedNode(item);
        if (existingNode) {
          if (!graph.getEdge(existingNode, node)) {
            edgeCreator(item, existingNode, node);
          }
        } else {
          newItems.push(item);
          let newNode = nodeCreator(item, location);
          if (!graph.getEdge(newNode, node)) {
            edgeCreator(item, newNode, node);
          }
        }
      });
    }
    return newItems;
  }

  async loadAndConnectSchemaUndirectedEdges(
    item,
    schemaEdge,
    nodeCreator,
    edgeCreator
  ) {
    let node = this.getLoadedNode(item);
    let newItems = [];
    if (node) {
      let location = node.layout.center.toPoint();
      let graph = this.graphComponent.graph;
      (await this.loader.loadOutEdges(schemaEdge, item)).forEach((item) => {
        let existingNode = this.getLoadedNode(item);
        if (existingNode) {
          if (
            !graph.getEdge(existingNode, node) &&
            !graph.getEdge(node, existingNode)
          ) {
            edgeCreator(item, existingNode, node);
          }
        } else {
          newItems.push(item);
          let newNode = nodeCreator(this, item, location);
          if (!graph.getEdge(newNode, node) && !graph.getEdge(node, newNode)) {
            edgeCreator(item, newNode, node);
          }
        }
      });
      return newItems;
    }
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
      let nodes = await this.loader.loadNodes(schemaNode, whereClauses, params);
      nodes
        .filter((item) => !this.getLoadedNode(item))
        .forEach((item) => schemaNode.tag.creator(item));
      return nodes;
    });
  }

  async loadNodeForSchema(schemaNode, id) {
    return await this.loadAndLayout(async () => {
      let item = await this.loader.loadNodeById(schemaNode, id);
      if (item && !this.getLoadedNode(item)) {
        schemaNode.tag.creator(item);
      }
      return item;
    });
  }

  loadMissingEdges(missingEdges, schemaEdge) {
    let graph = this.graphComponent.graph;
    missingEdges.forEach((missingEdge) => {
      let sourceNode = this.getLoadedNode({
        identity: missingEdge.sourceId,
      });
      let targetNode = this.getLoadedNode({
        identity: missingEdge.targetId,
      });
      if (!graph.getEdge(sourceNode, targetNode)) {
        schemaEdge.tag.creator({}, sourceNode, targetNode);
      }
    });
  }

  async loadMissingEdgesForSchemaNodes(schemaNode, newItems) {
    if (newItems.length > 0) {
      await Promise.all(
        this.loader.schemaGraph
          .inEdgesAt(schemaNode)
          .toArray()
          .map(async (schemaEdge) => {
            const missingEdges = await this.loader.loadMissingEdges(
              schemaEdge,
              this.getLoadedItemsOfType(schemaEdge.sourceNode),
              newItems
            );
            this.loadMissingEdges(missingEdges, schemaEdge);
          })
      );
      await Promise.all(
        this.loader.schemaGraph
          .outEdgesAt(schemaNode)
          .filter((e) => e.targetNode !== schemaNode)
          .toArray()
          .map(async (schemaEdge) => {
            const missingEdges = await this.loader.loadMissingEdges(
              schemaEdge,
              newItems,
              this.getLoadedItemsOfType(schemaEdge.targetNode)
            );
            this.loadMissingEdges(missingEdges, schemaEdge);
          })
      );
    }
  }

  async loadInEdges(item, schemaEdge) {
    await this.loadAndLayout(async () => {
      const newItems = await this.loadAndConnectSchemaInEdges(
        item,
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

  async loadOutEdges(item, schemaEdge) {
    await this.loadAndLayout(async () => {
      const newItems = await this.loadAndConnectSchemaOutEdges(
        item,
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

  async loadTargets(items, schemaEdge) {
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

  async loadSources(items, schemaEdge) {
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

  async loadEdges(item, schemaEdge) {
    await this.loadAndLayout(() =>
      this.loadAndConnectSchemaUndirectedEdges(
        item,
        schemaEdge,
        schemaEdge.sourceNode.tag.creator,
        schemaEdge.tag.creator
      )
    );
  }

  async runLayout() {
    await this.graphComponent.morphLayout(this.layout);
  }
}

export default class SchemaBasedLoader {
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
   * @return {IEdge}
   */
  addRelationShip(
    relationShipType,
    sourceNodeType,
    targetNodeType,
    matchClause
  ) {
    return this.schemaGraph.createEdge({
      source: sourceNodeType,
      target: targetNodeType,
      tag: { matchClause, relationShipType },
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
    } RETURN distinct(targetNode) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createInEdgeQuery(schemaEdge) {
    return `MATCH (targetNode:${schemaEdge.targetNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN distinct(sourceNode) as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createMissingEdgesQuery(schemaEdge) {
    return `MATCH (sourceNode:${schemaEdge.sourceNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(sourceNode) in $sourceIds MATCH ${
      schemaEdge.tag.matchClause
    } WHERE id(targetNode) in $targetIds RETURN id(sourceNode) as sourceNodeId, id(targetNode) as targetNodeId LIMIT ${limit}`;
  }

  /**
   * @param {{identity:string}} item
   * @param {IEdge} schemaEdge
   */
  async loadOutEdges(schemaEdge, item) {
    return await query(this.createOutEdgeQuery(schemaEdge), {
      sourceId: item.identity,
    });
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
  async loadInEdges(schemaEdge, item) {
    return await query(this.createInEdgeQuery(schemaEdge), {
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
   * @return {Promise<{sourceId:integer, targetId:integer}[]>}
   */
  async loadMissingEdges(schemaEdge, sourceObjects, targetObjects) {
    return (
      await coreQuery(this.createMissingEdgesQuery(schemaEdge), {
        sourceIds: sourceObjects.map((item) => item.identity),
        targetIds: targetObjects.map((item) => item.identity),
      })
    ).records.map((r) => ({
      sourceId: r.get("sourceNodeId"),
      targetId: r.get("targetNodeId"),
    }));
  }
}
