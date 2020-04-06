import { DefaultGraph, IEdge, INode } from "yfiles";

import coreQuery from "./dbconnection";

async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args)).records.map((r) => r.get(name));
}

const limit = 200;

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

  /** @param {IEdge[]} schemaEdges */
  createCommonNeighborsQuery(schemaEdges) {
    /*
     MATCH (sourceNode:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation) WHERE id(sourceNode) = 2052470 WITH collect(targetNode) as targetList
     MATCH (sourceNode:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation) WHERE id(sourceNode) = 404 AND targetNode in targetList WITH collect(targetNode) as targetList
     RETURN targetList
     */

    return `${schemaEdges.map((edge, i) =>
      `MATCH ${schemaEdges.tag.matchClause} WHERE ${
        i > 0 ? "targetNode in targetList AND" : ""
      } id(sourceNode) = $id[${i}] 
      WITH collect(distinct(targetNode)) as targetList`.join("\n")
    )}
      RETURN targetList as result`;
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
