import { DefaultGraph, Point, Rect, Size, IEdge, INode } from "yfiles";

import coreQuery from "./dbconnection";

async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args, name)).records.map((r) => r.get(name));
}

const limit = 50;

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
    )} RETURN node as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createOutEdgeQuery(schemaEdge) {
    return `MATCH (sourceNode:${schemaEdge.sourceNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(sourceNode) = $sourceId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN targetNode as result LIMIT ${limit}`;
  }

  /** @param {IEdge} schemaEdge */
  createInEdgeQuery(schemaEdge) {
    return `MATCH (targetNode:${schemaEdge.targetNode.tag.nodeLabels.join(
      ":"
    )}) WHERE id(targetNode) = $targetId MATCH ${
      schemaEdge.tag.matchClause
    } RETURN sourceNode as result LIMIT ${limit}`;
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
   * @param {IEdge} schemaEdge
   */
  async loadOutEdges(schemaEdge, item) {
    return await query(this.createOutEdgeQuery(schemaEdge), {
      sourceId: item.identity,
    });
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
   * @param {INode} schemaNode
   */
  async loadNodes(schemaNode, whereClause, params) {
    return await query(
      this.createLoadNodesQuery(schemaNode, whereClause),
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
