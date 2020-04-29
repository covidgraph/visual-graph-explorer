import VuejsNodeStyle from "../graph-styles/VuejsNodeStyle";
import PaperNode from "../graph-styles/PaperNode";
import PatentNode from "../graph-styles/PatentNode";
import AuthorNode from "../graph-styles/AuthorNode";
import GeneNode from "../graph-styles/GeneNode";
import {
  Arrow,
  ArrowType,
  DefaultLabelStyle,
  PolylineEdgeStyle,
  ShapeNodeStyle,
  Size,
  SmartEdgeLabelModel,
  Stroke,
} from "yfiles";
import SchemaBasedQueryBuilder, {
  IncrementalGraphLoader,
} from "./schema-based-query-builder";
import { isStagingDb } from "./dbconnection";

export const edgeStyle = new PolylineEdgeStyle({
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

export class CovidGraphLoader extends IncrementalGraphLoader {
  constructor(graphComponent) {
    super(new SchemaBasedQueryBuilder(), graphComponent);

    let staging = isStagingDb();

    this.patentType = this.addNodeType(
      "Patent",
      new VuejsNodeStyle(PatentNode),
      new Size(40, 40)
    );

    this.paperType = this.addNodeType(
      "Paper",
      new VuejsNodeStyle(PaperNode),
      new Size(150, 150)
    );

    this.authorType = this.addNodeType(
      "Author",
      new VuejsNodeStyle(AuthorNode),
      new Size(150, 150)
    );

    this.affiliationType = this.addNodeType(
      "Affiliation",
      new ShapeNodeStyle({ stroke: null, fill: "yellow", shape: "ellipse" }),
      new Size(50, 50),
      (affiliation) => [affiliation.properties.institution || "untitled"]
    );

    this.geneSymbolType = this.addNodeType(
      "GeneSymbol",
      new VuejsNodeStyle(GeneNode),
      new Size(150, 150),
      null,
      "gene",
      "genes"
    );

    this.proteinType = this.addNodeType(
      "Protein",
      new ShapeNodeStyle(),
      new Size(50, 50),
      (entity) => [entity.properties.sid || "untitled"]
    );

    this.transcriptType = this.addNodeType(
      "Transcript",
      new ShapeNodeStyle(),
      new Size(50, 50),
      (entity) => [entity.properties.sid || "untitled"]
    );

    this.entityType = this.addNodeType(
      "Entity",
      new ShapeNodeStyle(),
      new Size(50, 50),
      (entity) => [entity.properties.name || "untitled"],
      "entity",
      "entities"
    );

    if (staging) {
      this.gTexTissueType = this.addNodeType(
        "GtexTissue",
        new ShapeNodeStyle(),
        new Size(50, 50),
        (entity) => [entity.properties.sid || "untitled"],
        "tissue",
        "tissues"
      );
    }

    const wroteEdgeStyle = new PolylineEdgeStyle({
      stroke: "2px blue",
    });

    this.paper_author = this.addRelationShip(
      this.paperType,
      this.authorType,
      wroteEdgeStyle,
      () => [],
      staging
        ? "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(targetNode:Author)"
        : "(sourceNode:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(targetNode:Author)"
    );

    this.paper_affiliation = this.addRelationShip(
      this.paperType,
      this.affiliationType,
      wroteEdgeStyle,
      () => [],
      staging
        ? "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation)"
        : "(sourceNode:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation)",
      "authoring",
      "submitted"
    );

    this.paper_geneSymbol = this.addRelationShip(
      this.paperType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      staging
        ? "(sourceNode:Paper)-[:PAPER_HAS_BODYTEXTCOLLECTION|PAPER_HAS_ABSTRACTCOLLECTION]->()-[:BODYTEXTCOLLECTION_HAS_BODYTEXT|ABSTRACTCOLLECTION_HAS_ABSTRACT]->()-[:HAS_FRAGMENT]->(:Fragment)-[:MENTIONS]->(targetNode:GeneSymbol)"
        : "(sourceNode:Paper)-[:PAPER_HAS_BODY_TEXT]->(:Body_text:CollectionHub)-[:BODY_TEXT_HAS_BODY_TEXT]->(:Body_text)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)",
      "mentioned",
      "mentioning"
    );

    //

    this.patent_geneSymbol = this.addRelationShip(
      this.patentType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      staging
        ? "(sourceNode:Patent)-[:PATENT_HAS_PATENTABSTRACT|PATENT_HAS_PATENTTITLE|PATENT_HAS_PATENTDESCRIPTION|PATENT_HAS_PATENTCLAIM]->()-[:HAS_FRAGMENT]->(:Fragment)-[:MENTIONS]->(targetNode:GeneSymbol)"
        : "(sourceNode:Patent)-[:HAS_DESCRIPTION]->(:PatentDescription)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)",
      "mentioned",
      "mentioning"
    );

    this.paper_paper = this.addRelationShip(
      this.paperType,
      this.paperType,
      edgeStyle,
      () => [],
      staging
        ? "(sourceNode:Paper)-[:PAPER_HAS_REFERENCECOLLECTION]->(:ReferenceCollection)-[:REFERENCECOLLECTION_HAS_REFERENCE]->(:Reference)-[:REFERENCE_HAS_PAPERID]->(:PaperID)<-[:PAPER_HAS_PAPERID]-(targetNode:Paper)"
        : "(sourceNode:Paper)-[:PAPER_HAS_BIB_ENTRIES]->(:Bib_entries)-[:BIB_ENTRIES_HAS_BIBREF]->(:Bibref)-[:BIBREF_HAS_OTHER_IDS]->(:Other_ids)-->(:CollectionHub)-->(paperId)<-[:PAPERID_COLLECTION_HAS_PAPERID]-(:CollectionHub:PaperID)<-[:PAPER_HAS_PAPERID_COLLECTION]-(targetNode:Paper)",
      "referenced",
      "referencing"
    );

    this.protein_geneSymbol = this.addRelationShip(
      this.proteinType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      "(targetNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:CODES]->(:Transcript)-[:CODES]->(sourceNode:Protein)",
      "encoding",
      "encoded"
    );

    this.patent_owner_entity = this.addRelationShip(
      this.patentType,
      this.entityType,
      edgeStyle,
      () => ["OWNED BY"],
      "(sourceNode:Patent)-[:APPLICANT|INVENTOR|OWNER]->(targetNode:Entity)",
      "owning",
      "owned"
    );

    if (staging) {
      this.geneSymbol_gTexTissue = this.addRelationShip(
        this.geneSymbolType,
        this.gTexTissueType,
        edgeStyle,
        () => [],
        "(sourceNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:EXPRESSED]->(:GtexDetailedTissue)<-[:PARENT]-(targetNode:GtexTissue)",
        "expressed",
        "expressing"
      );
      this.patent_patent = this.addRelationShip(
        this.patentType,
        this.patentType,
        edgeStyle,
        () => [],
        "(sourceNode:Patent)-[:PATENT_HAS_PATENTCITATIONCOLLECTION]->(:PatentCitationCollection)-[:PATENTCITATIONCOLLECTION_HAS_PATENTLITERATURECITATION]->(:PatentLiteratureCitation)-[:PATENTLITERATURECITATION_HAS_PATENTNUMBER]->(:PatentNumber)<-[:PATENT_HAS_PATENTNUMBER]-(targetNode:Patent)",
        "referenced",
        "referencing"
      );
    }
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
      let commonEventNameIn = `load-${schemaNode.tag.type}`;
      eventBus.$on(commonEventNameIn, (id) =>
        this.loadAndConnectNodeForSchema(schemaNode, id)
      );
    });
  }
}
