import VuejsNodeStyle from "../graph-styles/VuejsNodeStyle";
import PaperNode from "../graph-styles/PaperNode";
import PatentNode from "../graph-styles/PatentNode";
import AuthorNode from "../graph-styles/AuthorNode";
import GeneNode from "../graph-styles/GeneNode";
import {
  Arrow,
  ArrowType,
  DefaultLabelStyle,
  IEnumerable,
  PolylineEdgeStyle,
  ShapeNodeStyle,
  Size,
  SmartEdgeLabelModel,
  Stroke,
} from "yfiles";
import SchemaBasedQueryBuilder, {
  IncrementalGraphLoader,
} from "./schema-based-query-builder";
import PathwayNode from "../graph-styles/PathwayNode";
import ProteinNode from "../graph-styles/ProteinNode";
import AffiliationNode from "../graph-styles/AffiliationNode";
import EntityNode from "../graph-styles/EntityNode";
import TissueNode from "../graph-styles/TissueNode";
import coreQuery from "./dbconnection";
import ClinicalTrialNode from "../graph-styles/ClinicalTrialNode";
import DiseaseNode from "../graph-styles/DiseaseNode";
import { getId } from "./Neo4jGraphBuilder";

export async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args)).records.map((r) => r.get(name));
}

// the maximum number of elements fetched from the server for one request
const queryLimit = 250;

const insertAnds = (s) => s.split(/\s+/).join(" AND ");

async function queryPapers(queryString) {
  return (
    Promise.all([
      query(
        `MATCH (p:Paper) WHERE toLower(p.title) CONTAINS $word RETURN p as result LIMIT ${queryLimit}`,
        { word: queryString.toLowerCase() }
      ),
      query(
        `CALL db.index.fulltext.queryNodes("textOfPapersAndPatents", $query) YIELD node, score
          match (node)<-[:HAS_FRAGMENT]-()<-[:ABSTRACTCOLLECTION_HAS_ABSTRACT|PAPER_HAS_ABSTRACTCOLLECTION*1..2]-(p:Paper) where node:Fragment and not node:AbstractCollection
          WITH p as result ORDER BY score DESC LIMIT ${queryLimit} RETURN distinct(result)`,
        { query: queryString }
      ),
    ])
      // Lazily load input items
      .then(([titleMatches, textMatches]) => {
        return IEnumerable.from(
          [...titleMatches, ...textMatches].map((node) => ({
            id: node.identity,
            publishTime: node.properties["publish_time"],
            title: node.properties["title"],
          }))
        )
          .distinct((arg) => getId(arg.id))
          .toArray();
      })
  );
}

const collectTitlesAndIds = (result) =>
  result.records.map((record) => ({
    id: record.get("id"),
    title: record.get("titles")[0],
  }));

function mergeWithIds(titles, patents) {
  const map = new Map();
  titles.forEach((t) => map.set(getId(t.id), t));
  return patents.map((p) => {
    Object.assign(p, map.get(getId(p.identity)));
    return p;
  });
}

async function addPatentTitles(patents) {
  return coreQuery(
    `MATCH (p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle) 
    WHERE id(p) in $patentIds 
    RETURN id(p) as id, collect(pt.text) as titles LIMIT ${queryLimit}`,
    { patentIds: patents.map((p) => p.identity) }
  )
    .then(collectTitlesAndIds)
    .then((titles) => mergeWithIds(titles, patents));
}

async function queryPatents(queryString) {
  return (
    Promise.all([
      coreQuery(
        `call db.index.fulltext.queryNodes("PatentsFulltextIndex", $searchText)
yield node,score match (node)--(p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle)
WITH p ORDER BY score DESC with distinct(p) 
match (p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle) RETURN id(p) as id, collect(pt.text) as titles LIMIT ${queryLimit}
`,
        {
          searchText: queryString,
        }
      ).then(collectTitlesAndIds),
      coreQuery(
        `CALL db.index.fulltext.queryNodes("textOfPapersAndPatents", $query) YIELD node, score
          match (node:Fragment)<-[:HAS_FRAGMENT]-(:PatentAbstract)<-[:PATENT_HAS_PATENTABSTRACT]-(p:Patent) 
          WITH p as result ORDER BY score DESC WITH distinct(result) as p 
          match (p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle) RETURN id(p) as id, collect(pt.text) as titles LIMIT ${queryLimit}`,
        { query: queryString }
      ).then(collectTitlesAndIds),
    ])
      // Lazily load input items
      .then(([titleMatches, textMatches]) => {
        return IEnumerable.from([...titleMatches, ...textMatches])
          .distinct((arg) => getId(arg.id))
          .toArray();
      })
  );
}

async function queryGenes(queryString) {
  return await Promise.all([
    createSearchQuery(
      `CALL db.index.fulltext.queryNodes("GeneSymbolFullTextIndex", $query) YIELD node, score WITH node ORDER BY score DESC LIMIT ${queryLimit} RETURN node as result`,
      ["sid", "GeneSymbol", "status"],
      insertAnds
    )(queryString),
    createQuery(
      `MATCH (g:GeneSymbol)
           WHERE toLower(g.sid) 
            STARTS WITH $query
           RETURN g as result LIMIT ${queryLimit}`,
      ["sid", "status, GeneSymbol"],
      false
    )(queryString),
  ]).then(([match1, match2]) => {
    return IEnumerable.from(match1)
      .concat(IEnumerable.from(match2))
      .distinct((arg) => getId(arg.id))
      .toArray();
  });
}

async function queryAuthors(queryString) {
  return await query(
    `CALL db.index.fulltext.queryNodes("AuthorFullTextIndex", $query) YIELD node, score WITH node ORDER BY score DESC LIMIT ${queryLimit} RETURN node as result`,
    { query: insertAnds(queryString) }
  ).then((res) =>
    res.map((node) => ({
      id: node.identity,
      first: node.properties["first"],
      last: node.properties["last"],
    }))
  );
}

export const edgeStyle = new PolylineEdgeStyle({
  smoothingLength: 500,
  stroke: new Stroke({
    fill: "gray",
    thickness: 3,
  }),
  targetArrow: new Arrow({
    fill: "gray",
    type: ArrowType.TRIANGLE,
    scale: 2,
  }),
});

export const edgeLabelStyle = new DefaultLabelStyle({
  textFill: "gray",
  textSize: 20,
});

export const edgeLabelLayoutParameter = new SmartEdgeLabelModel({
  autoRotation: true,
}).createParameterFromSource({
  distance: 6,
  segmentIndex: 0,
  segmentRatio: 0.5,
});

/**
 *
 * @param {String} match
 * @param {String[]} props
 * @return {function(*): *}
 */
function createQuery(match, props, caseSensitive = false) {
  if (caseSensitive) {
    return createSearchQuery(match, props, (s) => s);
  } else {
    return createSearchQuery(match, props, (s) => s.toLocaleLowerCase());
  }
}

/**
 *
 * @param {String} match
 * @param {String[]} props
 * @param {function(s:string):string} queryTransform
 * @return {function(*): *}
 */
function createSearchQuery(match, props, queryTransform) {
  return function (queryString) {
    return query(match, { query: queryTransform(queryString) }).then((res) =>
      res.map((node) =>
        props.reduce(
          (prev, current) => {
            prev[current] = node.properties[current];
            return prev;
          },
          { id: node.identity }
        )
      )
    );
  };
}

function toTableName(name) {
  return name.substring(0, 1).toUpperCase() + name.substring(1);
}

function createMetaData(
  type,
  props = [],
  nameProp = "name",
  tableName = null,
  query = null
) {
  return {
    name: tableName || toTableName(type) + "s",
    table: {
      headers: props.map((p) => ({
        text: toTableName(p),
        value: p,
        align: "start",
        sortable: true,
      })),
      query:
        query ||
        createQuery(
          `MATCH (n:${type})
           WHERE toLower(n.${nameProp}) 
            CONTAINS $query
           RETURN n as result LIMIT ${queryLimit}`,
          props
        ),
    },
  };
}

export class CovidGraphLoader extends IncrementalGraphLoader {
  constructor(graphComponent) {
    super(new SchemaBasedQueryBuilder(), graphComponent);

    this.geneSymbolType = this.addNodeType({
      type: "GeneSymbol",
      style: new VuejsNodeStyle(GeneNode),
      size: new Size(150, 150),
      singularName: "gene",
      pluralName: "genes",
      metadata: {
        name: "Genes",
        table: {
          headers: [
            { text: "SID", value: "sid", align: "start", sortable: true },
            { text: "Status", value: "status", sortable: true },
          ],
          query: queryGenes,
        },
      },
    });

    this.patentType = this.addNodeType({
      type: "Patent",
      style: new VuejsNodeStyle(PatentNode),
      size: new Size(80, 80),
      metadata: {
        name: "Patents",
        table: {
          headers: [
            { text: "Title", value: "title", align: "start", sortable: true },
          ],
          propertyLoader: addPatentTitles,
          query: queryPatents,
        },
      },
    });

    this.paperType = this.addNodeType({
      type: "Paper",
      style: new VuejsNodeStyle(PaperNode),
      size: new Size(150, 150),
      metadata: {
        name: "Publications",
        table: {
          headers: [
            { text: "Title", value: "title", align: "start", sortable: true },
            { text: "Publication Date", value: "publishTime", sortable: true },
          ],
          query: queryPapers,
        },
      },
    });

    this.diseaseType = this.addNodeType({
      type: "Disease",
      style: new VuejsNodeStyle(DiseaseNode),
      size: new Size(150, 150),
      singularName: "disease",
      pluralName: "diseases",
      metadata: createMetaData("Disease", ["name", "definition", "doid"]),
    });

    this.proteinType = this.addNodeType({
      type: "Protein",
      style: new VuejsNodeStyle(ProteinNode),
      size: new Size(150, 150),
      metadata: createMetaData("Protein", ["sid", "name", "category"], "name"),
    });

    this.transcriptType = this.addNodeType({
      type: "Transcript",
      style: new ShapeNodeStyle(),
      size: new Size(50, 50),
      labels: (entity) => [entity.properties.sid || "untitled"],
    });

    this.anatomyType = this.addNodeType({
      type: "Anatomy",
      style: new ShapeNodeStyle(),
      size: new Size(50, 50),
      labels: (entity) => [entity.properties.name || "untitled"],
      pluralName: "anatomies",
      metadata: createMetaData(
        "Anatomy",
        ["name", "uberon_id", "mesh_id", "bto_id"],
        "name",
        "Anatomies"
      ),
    });

    this.affiliationType = this.addNodeType({
      type: "Affiliation",
      style: new VuejsNodeStyle(AffiliationNode),
      size: new Size(80, 80),
      metadata: createMetaData(
        "Affiliation",
        ["institution", "laboratory"],
        "institution"
      ),
    });

    this.entityType = this.addNodeType({
      type: "Entity",
      style: new VuejsNodeStyle(EntityNode),
      size: new Size(120, 120),
      singularName: "entity",
      pluralName: "entities",
      metadata: createMetaData(
        "Entity",
        ["name", "category"],
        "name",
        "Entities",
        createSearchQuery(
          `CALL db.index.fulltext.queryNodes("EntityFullTextIndex", $query) YIELD node, score WITH node ORDER BY score DESC LIMIT ${queryLimit} RETURN node as result`,
          ["name", "category"],
          insertAnds
        )
      ),
    });

    this.authorType = this.addNodeType({
      type: "Author",
      style: new VuejsNodeStyle(AuthorNode),
      size: new Size(150, 150),
      metadata: {
        name: "Authors",
        table: {
          headers: [
            {
              text: "Last Name",
              value: "last",
              align: "start",
              sortable: true,
            },
            {
              text: "First Name",
              value: "first",
              align: "start",
              sortable: true,
            },
          ],
          query: queryAuthors,
        },
      },
    });

    this.clinicalTrialType = this.addNodeType({
      type: "ClinicalTrial",
      style: new VuejsNodeStyle(ClinicalTrialNode),
      size: new Size(150, 150),
      singularName: "clinical trial",
      pluralName: "clinical trials",
      metadata: createMetaData(
        "ClinicalTrial",
        ["NCTId"],
        "name",
        "Clinical Trials"
      ),
    });
    this.facilityType = this.addNodeType({
      type: "Facility",
      style: new VuejsNodeStyle(EntityNode),
      size: new Size(50, 50),
      labels: (item) => item.properties.facilityName,
      singularName: "facility",
      pluralName: "facilities",
      metadata: createMetaData("Facility", ["name"], "name", "Facilities"),
    });
    this.exclusionCriteriaType = this.addNodeType({
      type: "ExclusionCriteria",
      style: new ShapeNodeStyle({ shape: "diamond", fill: "red" }),
      size: new Size(50, 50),
      labels: (item) => item.properties.criteria,
      singularName: "exclusion criteria",
      pluralName: "exclusion criteria",
    });
    this.inclusionCriteriaType = this.addNodeType({
      type: "InclusionCriteria",
      style: new ShapeNodeStyle({ shape: "diamond", fill: "green" }),
      size: new Size(50, 50),
      labels: (item) => item.properties.criteria,
      singularName: "inclusion criteria",
      pluralName: "inclusion criteria",
    });

    this.pathwayType = this.addNodeType({
      type: "Pathway",
      style: new VuejsNodeStyle(PathwayNode),
      size: new Size(150, 150),
      singularName: "pathway",
      pluralName: "pathways",
      metadata: createMetaData("Pathway", ["name", "sid", "org", "desc"]),
    });

    this.gTexDetailedTissueType = this.addNodeType({
      type: "GtexDetailedTissue",
      style: new VuejsNodeStyle(TissueNode),
      size: new Size(150, 150),
      singularName: "tissue",
      pluralName: "tissues",
      metadata: createMetaData(
        "GtexDetailedTissue",
        ["name"],
        "name",
        "Tissues"
      ),
    });

    const wroteEdgeStyle = new PolylineEdgeStyle({
      smoothingLength: 500,
      stroke: "2px blue",
    });

    this.paper_author = this.addRelationShip({
      sourceNode: this.paperType,
      targetNode: this.authorType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(targetNode:Author)",
    });

    this.trial_paper = this.addRelationShip({
      sourceNode: this.clinicalTrialType,
      targetNode: this.paperType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:ClinicalTrial)-[:REFERS_TO]->(c:Citation)-[:HAS_PUBLICATION_ID]->(:PaperID)<-[:PAPER_HAS_PAPERID]-(targetNode:Paper)",
      relatedVerb: "cited in",
      relatingVerb: "citing",
    });
    this.disease_anatomy = this.addRelationShip({
      sourceNode: this.diseaseType,
      targetNode: this.anatomyType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:Disease)-[relation:LOCALIZES_DlA]->(targetNode:Anatomy)",
      relatedVerb: "localized",
      relatingVerb: "hosting",
      tooltipFunction: (relation) => "" + relation.properties.expected,
    });
    this.geneSymbol_disease = this.addRelationShip({
      sourceNode: this.diseaseType,
      targetNode: this.geneSymbolType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:Disease)-[:ASSOCIATES_DaG]->(:Gene)-[:MAPS]->(targetNode:GeneSymbol)",
      relatedVerb: "associated",
      relatingVerb: "associated",
    });
    this.geneSymbol_transcript = this.addRelationShip({
      sourceNode: this.geneSymbolType,
      targetNode: this.transcriptType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:GeneSymbol)<-[:MAPS]->(:Gene)-[:CODES]->(targetNode:Transcript)",
      relatedVerb: "coded",
      relatingVerb: "coding",
    });
    this.transcript_protein = this.addRelationShip({
      sourceNode: this.transcriptType,
      targetNode: this.proteinType,
      style: wroteEdgeStyle,
      matchClause: "(sourceNode:Transcript)-[:CODES]->(targetNode:Protein)",
      relatedVerb: "coded",
      relatingVerb: "coding",
    });
    this.trial_facility = this.addRelationShip({
      sourceNode: this.clinicalTrialType,
      targetNode: this.facilityType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:ClinicalTrial)-[:CONDUCTED_AT]->(targetNode:Facility)",
      relatedVerb: "conducting",
      relatingVerb: "conducted",
    });
    this.trial_exclusion_criteria = this.addRelationShip({
      sourceNode: this.clinicalTrialType,
      targetNode: this.exclusionCriteriaType,
      style: new PolylineEdgeStyle({ stroke: "2px red", smoothingLength: 500 }),
      matchClause:
        "(sourceNode:ClinicalTrial)-[:HAS_EXCLUSION_CRITERIA]->(targetNode:ExclusionCriteria)",
      relatedVerb: "applied",
      relatingVerb: "applying",
    });
    this.trial_exclusion_criteria = this.addRelationShip({
      sourceNode: this.clinicalTrialType,
      targetNode: this.inclusionCriteriaType,
      style: new PolylineEdgeStyle({ stroke: "2px green" }),
      matchClause:
        "(sourceNode:ClinicalTrial)-[:HAS_INCLUSION_CRITERIA]->(targetNode:InclusionCriteria)",
      relatedVerb: "applied",
      relatingVerb: "applying",
    });

    this.paper_affiliation = this.addRelationShip({
      sourceNode: this.paperType,
      targetNode: this.affiliationType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation)",
      relatedVerb: "authoring",
      relatingVerb: "submitted",
    });

    this.paper_geneSymbol = this.addRelationShip({
      sourceNode: this.paperType,
      targetNode: this.geneSymbolType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:Paper)-[:PAPER_HAS_BODYTEXTCOLLECTION|PAPER_HAS_ABSTRACTCOLLECTION]->()-[:BODYTEXTCOLLECTION_HAS_BODYTEXT|ABSTRACTCOLLECTION_HAS_ABSTRACT]->()-[:HAS_FRAGMENT]->(relation:Fragment)-[:MENTIONS]->(targetNode:GeneSymbol)",
      relatedVerb: "mentioned",
      relatingVerb: "mentioning",
      tooltipFunction: (item) => item.properties.text,
    });

    //

    this.patent_geneSymbol = this.addRelationShip({
      sourceNode: this.patentType,
      targetNode: this.geneSymbolType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:Patent)-[:PATENT_HAS_PATENTABSTRACT|PATENT_HAS_PATENTTITLE|PATENT_HAS_PATENTDESCRIPTION|PATENT_HAS_PATENTCLAIM]->()-[:HAS_FRAGMENT]->(relation:Fragment)-[:MENTIONS]->(targetNode:GeneSymbol)",
      relatedVerb: "mentioned",
      relatingVerb: "mentioning",
      tooltipFunction: (item) => item.properties.text,
    });

    this.paper_paper = this.addRelationShip({
      sourceNode: this.paperType,
      targetNode: this.paperType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:Paper)-[:PAPER_HAS_REFERENCECOLLECTION]->(:ReferenceCollection)-[:REFERENCECOLLECTION_HAS_REFERENCE]->(:Reference)-[:REFERENCE_HAS_PAPERID]->(:PaperID)<-[:PAPER_HAS_PAPERID]-(targetNode:Paper)",
      relatedVerb: "referenced",
      relatingVerb: "referencing",
    });

    this.protein_geneSymbol = this.addRelationShip({
      sourceNode: this.proteinType,
      targetNode: this.geneSymbolType,
      style: edgeStyle,
      matchClause:
        "(targetNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:CODES]->(:Transcript)-[:CODES]->(sourceNode:Protein)",
      relatedVerb: "encoding",
      relatingVerb: "encoded",
    });

    this.patent_owner_entity = this.addRelationShip({
      sourceNode: this.patentType,
      targetNode: this.entityType,
      style: edgeStyle,
      labels: (relation) => relation.type,
      matchClause:
        "(sourceNode:Patent)-[relation:INVENTOR|OWNER]->(targetNode:Entity)",
      relatedVerb: "owning",
      relatingVerb: "owned",
    });

    this.patent_applicant = this.addRelationShip({
      sourceNode: this.patentType,
      targetNode: this.entityType,
      style: edgeStyle,
      labels: (relation) => relation.type,
      matchClause:
        "(sourceNode:Patent)-[relation:APPLICANT]->(targetNode:Entity)",
      relatedVerb: "applying",
      relatingVerb: "applied for",
    });

    this.applicant_protein = this.addRelationShip({
      sourceNode: this.entityType,
      targetNode: this.proteinType,
      style: edgeStyle,
      labels: (relation) => relation.type,
      matchClause:
        "(sourceNode:Entity)<-[:APPLICANT|OWNER|INVENTOR]-(:Patent)-[:PATENT_HAS_PATENTABSTRACT|PATENT_HAS_PATENTTITLE|PATENT_HAS_PATENTDESCRIPTION|PATENT_HAS_PATENTCLAIM]->()-[:HAS_FRAGMENT]->(:Fragment)-[:MENTIONS]->(:GeneSymbol)-[:SYNONYM]->(:GeneSymbol)<-[:MAPS]-(g:Gene)-[:CODES]->(:Transcript)-[:CODES]->(targetNode:Protein)",
      relatedVerb: "related",
      relatingVerb: "related",
    });

    this.geneSymbol_gTexTissue = this.addRelationShip({
      sourceNode: this.geneSymbolType,
      targetNode: this.gTexDetailedTissueType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:GeneSymbol)-[:SYNONYM*0..1]-(gs:GeneSymbol)-[:MAPS]-(:Gene)-[:MAPS*0..1]-(:Gene)-[relation:EXPRESSED]->(targetNode:GtexDetailedTissue) WHERE toFloat(relation.val) > 0.3 WITH sourceNode, relation, targetNode",
      relatedVerb: "expressed",
      relatingVerb: "expressing",
      tooltipFunction: (relation) => relation.properties.val,
    });

    this.geneSymbol_pathway = this.addRelationShip({
      sourceNode: this.geneSymbolType,
      targetNode: this.pathwayType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:MEMBER]->(targetNode:Pathway)",
      relatedVerb: "related",
      relatingVerb: "related",
    });

    this.addIntersections(
      [
        this.paper_geneSymbol,
        this.geneSymbol_transcript,
        this.protein_geneSymbol,
        this.geneSymbol_gTexTissue,
        this.geneSymbol_pathway,
        this.geneSymbol_disease,
        this.patent_geneSymbol,
      ],
      this.geneSymbolType,
      "involved Genes"
    );

    this.addIntersections(
      [this.geneSymbol_transcript, this.transcript_protein],
      this.transcriptType,
      "involved Transcripts"
    );

    this.addIntersectionQuery({
      relationShip1: this.patent_owner_entity,
      connectingNode: this.patentType,
      relationShip2: this.patent_geneSymbol,
      name: "involved Patents",
    });

    this.pathway_pathway = this.addRelationShip({
      sourceNode: this.pathwayType,
      targetNode: this.pathwayType,
      style: edgeStyle,
      labels: () => ["Child"],
      matchClause: "(sourceNode:Pathway)-[:CHILD]->(targetNode:Pathway)",
      relatedVerb: "child",
      relatingVerb: "parent",
    });

    this.patent_patent = this.addRelationShip({
      sourceNode: this.patentType,
      targetNode: this.patentType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:Patent)-[:PATENT_HAS_PATENTCITATIONCOLLECTION]->(:PatentCitationCollection)-[:PATENTCITATIONCOLLECTION_HAS_PATENTLITERATURECITATION]->(:PatentLiteratureCitation)-[:PATENTLITERATURECITATION_HAS_PATENTNUMBER]->(:PatentNumber)<-[:PATENT_HAS_PATENTNUMBER]-(targetNode:Patent)",
      relatedVerb: "referenced",
      relatingVerb: "referencing",
    });

    this.disease_disease = this.addRelationShip({
      sourceNode: this.diseaseType,
      targetNode: this.diseaseType,
      style: wroteEdgeStyle,
      matchClause: "(sourceNode:Disease)-[:IS_A]->(targetNode:Disease)",
      relatedVerb: "parent",
      relatingVerb: "child",
    });
  }

  addIntersections(relations, connectingNode, name) {
    relations.forEach((leftRelation, leftIndex) => {
      relations.forEach((rightRelation, rightIndex) => {
        if (leftIndex < rightIndex) {
          this.addIntersectionQuery({
            relationShip1: leftRelation,
            relationShip2: rightRelation,
            connectingNode,
            name,
          });
        }
      });
    });
  }

  /**
   *
   * @param {INode} schemaNode
   * @return {(function(t:T[]):Promise<T[]>)|null}
   */
  createFilter(schemaNode, eventBus) {
    if (schemaNode.tag.metadata) {
      return function (items) {
        return new Promise((resolve, reject) => {
          if (items.length < 2) {
            resolve(items);
            return;
          }

          const uniqueItems = IEnumerable.from(items)
            .map((i, _index) => ({
              id: getId(i.item.identity),
              identity: i.item.identity,
              $origIndex: _index,
              ...i.item.properties,
            }))
            .groupBy(
              (i) => i.id,
              (id, items) => items
            )
            .toArray();

          if (schemaNode.tag.metadata.table.propertyLoader) {
            schemaNode.tag.metadata.table
              .propertyLoader(uniqueItems.map((i) => i.first()))
              .then(() => showDialog(uniqueItems));
          } else {
            showDialog(uniqueItems);
          }

          function showDialog(uniqueItems) {
            eventBus.$emit("show-results-dialog", {
              items: uniqueItems.map((i) => i.first()),
              headers: schemaNode.tag.metadata.table.headers,
              resolve: function (indices) {
                resolve(
                  indices !== null
                    ? indices.flatMap((i) =>
                        uniqueItems[i].map((i) => items[i.$origIndex]).toArray()
                      )
                    : null
                );
              },
            });
          }
        });
      };
    }
    return null;
  }

  registerEvents(eventBus) {
    this.queryBuilder.schemaGraph.edges.forEach((schemaEdge) => {
      let eventNameOut = `load-target-${schemaEdge.targetNode.tag.type}-for-${schemaEdge.sourceNode.tag.type}`;
      eventBus.$on(eventNameOut, (item) => this.loadOutEdges(item, schemaEdge));

      let commonEventNameOut = `load-common-target-${schemaEdge.targetNode.tag.type}-for-${schemaEdge.sourceNode.tag.type}`;
      eventBus.$on(commonEventNameOut, (items) =>
        this.loadCommonTargets(items, schemaEdge)
      );

      let eventNameIn = `load-source-${schemaEdge.sourceNode.tag.type}-for-${schemaEdge.targetNode.tag.type}`;
      eventBus.$on(eventNameIn, (item) => this.loadInEdges(item, schemaEdge));

      let commonEventNameIn = `load-common-source-${schemaEdge.sourceNode.tag.type}-for-${schemaEdge.targetNode.tag.type}`;
      eventBus.$on(commonEventNameIn, (items) =>
        this.loadCommonSources(items, schemaEdge)
      );
    });

    this.queryBuilder.schemaGraph.nodes.forEach((schemaNode) => {
      if (schemaNode.tag.metadata && !schemaNode.tag.metadata.filter) {
        schemaNode.tag.metadata.filter = this.createFilter(
          schemaNode,
          eventBus
        );
      }
      let commonEventNameIn = `load-${schemaNode.tag.type}`;
      eventBus.$on(commonEventNameIn, (id) =>
        this.loadAndConnectNodeForSchema(schemaNode, id)
      );
    });

    this.intersections.forEach((i) => {
      const intersectionEventName = `load-intersection-` + i.name;
      eventBus.$on(intersectionEventName, ({ left, right }) =>
        this.loadIntersection(left, right, i)
      );
    });
  }

  getTooltip(item) {
    const schemaObject = this.getSchemaObject(item);
    if (schemaObject) {
      return schemaObject.tag.tooltipFunction
        ? schemaObject.tag.tooltipFunction(item.tag)
        : null;
    } else {
      return null;
    }
  }
}
