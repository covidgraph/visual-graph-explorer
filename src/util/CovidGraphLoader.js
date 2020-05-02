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

    this.pathwayType = this.addNodeType(
      "Pathway",
      new ShapeNodeStyle(),
      new Size(50, 50),
      (entity) => [entity.properties.name || "untitled"],
      "pathway",
      "pathways"
    );

    this.gTexTissueType = this.addNodeType(
      "GtexTissue",
      new ShapeNodeStyle(),
      new Size(50, 50),
      (entity) => [entity.properties.sid || "untitled"],
      "tissue",
      "tissues"
    );

    const wroteEdgeStyle = new PolylineEdgeStyle({
      stroke: "2px blue",
    });

    this.paper_author = this.addRelationShip(
      this.paperType,
      this.authorType,
      wroteEdgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(targetNode:Author)"
    );

    this.paper_affiliation = this.addRelationShip(
      this.paperType,
      this.affiliationType,
      wroteEdgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation)",
      "authoring",
      "submitted"
    );

    this.paper_geneSymbol = this.addRelationShip(
      this.paperType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_BODYTEXTCOLLECTION|PAPER_HAS_ABSTRACTCOLLECTION]->()-[:BODYTEXTCOLLECTION_HAS_BODYTEXT|ABSTRACTCOLLECTION_HAS_ABSTRACT]->()-[:HAS_FRAGMENT]->(:Fragment)-[:MENTIONS]->(targetNode:GeneSymbol)",
      "mentioned",
      "mentioning"
    );

    //

    this.patent_geneSymbol = this.addRelationShip(
      this.patentType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      "(sourceNode:Patent)-[:PATENT_HAS_PATENTABSTRACT|PATENT_HAS_PATENTTITLE|PATENT_HAS_PATENTDESCRIPTION|PATENT_HAS_PATENTCLAIM]->()-[:HAS_FRAGMENT]->(:Fragment)-[:MENTIONS]->(targetNode:GeneSymbol)",
      "mentioned",
      "mentioning"
    );

    this.paper_paper = this.addRelationShip(
      this.paperType,
      this.paperType,
      edgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_REFERENCECOLLECTION]->(:ReferenceCollection)-[:REFERENCECOLLECTION_HAS_REFERENCE]->(:Reference)-[:REFERENCE_HAS_PAPERID]->(:PaperID)<-[:PAPER_HAS_PAPERID]-(targetNode:Paper)",
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
      (relation) => relation.type,
      "(sourceNode:Patent)-[relation:INVENTOR|OWNER]->(targetNode:Entity)",
      "owning",
      "owned"
    );

    this.patent_applicant = this.addRelationShip(
      this.patentType,
      this.entityType,
      edgeStyle,
      (relation) => relation.type,
      "(sourceNode:Patent)-[relation:APPLICANT]->(targetNode:Entity)",
      "applying",
      "owned"
    );

    this.applicant_protein = this.addRelationShip(
      this.entityType,
      this.proteinType,
      edgeStyle,
      (relation) => relation.type,
      "(sourceNode:Entity)<-[:APPLICANT|OWNER|INVENTOR]-(:Patent)-[:PATENT_HAS_PATENTABSTRACT|PATENT_HAS_PATENTTITLE|PATENT_HAS_PATENTDESCRIPTION|PATENT_HAS_PATENTCLAIM]->()-[:HAS_FRAGMENT]->(:Fragment)-[:MENTIONS]->(:GeneSymbol)-[:SYNONYM]->(:GeneSymbol)<-[:MAPS]-(g:Gene)-[:CODES]->(:Transcript)-[:CODES]->(targetNode:Protein)",
      "related",
      "related"
    );

    this.geneSymbol_gTexTissue = this.addRelationShip(
      this.geneSymbolType,
      this.gTexTissueType,
      edgeStyle,
      () => [],
      "(sourceNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:EXPRESSED]->(:GtexDetailedTissue)<-[:PARENT]-(targetNode:GtexTissue)",
      "expressed",
      "expressing"
    );

    this.geneSymbol_pathway = this.addRelationShip(
      this.geneSymbolType,
      this.pathwayType,
      edgeStyle,
      () => [],
      "(sourceNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:MEMBER]->(targetNode:Pathway)",
      "related",
      "related"
    );

    this.pathway_pathway = this.addRelationShip(
      this.pathwayType,
      this.pathwayType,
      edgeStyle,
      () => ["Child"],
      "(sourceNode:Pathway)-[:CHILD]->(targetNode:Pathway)",
      "child",
      "parent"
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
