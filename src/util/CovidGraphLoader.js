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
import PathwayNode from "../graph-styles/PathwayNode";
import ProteinNode from "../graph-styles/ProteinNode";
import AffiliationNode from "../graph-styles/AffiliationNode";
import EntityNode from "../graph-styles/EntityNode";

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

    this.patentType = this.addNodeType({
      type: "Patent",
      style: new VuejsNodeStyle(PatentNode),
      size: new Size(80, 80),
    });

    this.paperType = this.addNodeType({
      type: "Paper",
      style: new VuejsNodeStyle(PaperNode),
      size: new Size(150, 150),
    });

    this.authorType = this.addNodeType({
      type: "Author",
      style: new VuejsNodeStyle(AuthorNode),
      size: new Size(150, 150),
    });

    this.affiliationType = this.addNodeType({
      type: "Affiliation",
      style: new VuejsNodeStyle(AffiliationNode),
      size: new Size(80, 80),
    });

    this.geneSymbolType = this.addNodeType({
      type: "GeneSymbol",
      style: new VuejsNodeStyle(GeneNode),
      size: new Size(150, 150),
      singularName: "gene",
      pluralName: "genes",
    });

    this.proteinType = this.addNodeType({
      type: "Protein",
      style: new VuejsNodeStyle(ProteinNode),
      size: new Size(150, 150),
    });

    this.transcriptType = this.addNodeType({
      type: "Transcript",
      style: new ShapeNodeStyle(),
      size: new Size(50, 50),
      labels: (entity) => [entity.properties.sid || "untitled"],
    });

    this.entityType = this.addNodeType({
      type: "Entity",
      style: new VuejsNodeStyle(EntityNode),
      size: new Size(120, 120),
      singularName: "entity",
      pluralName: "entities",
    });

    this.pathwayType = this.addNodeType({
      type: "Pathway",
      style: new VuejsNodeStyle(PathwayNode),
      size: new Size(150, 150),
      singularName: "pathway",
      pluralName: "pathways",
    });

    this.gTexTissueType = this.addNodeType({
      type: "GtexTissue",
      style: new ShapeNodeStyle(),
      size: new Size(50, 50),
      labels: (entity) => [entity.properties.sid || "untitled"],
      singularName: "tissue",
      pluralName: "tissues",
    });

    const wroteEdgeStyle = new PolylineEdgeStyle({
      stroke: "2px blue",
    });

    this.paper_author = this.addRelationShip({
      sourceNode: this.paperType,
      targetNode: this.authorType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:Paper)-[:PAPER_HAS_AUTHORCOLLECTION]->(:AuthorCollection)-[:AUTHORCOLLECTION_HAS_AUTHOR]->(targetNode:Author)",
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
      relatingVerb: "owned",
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
      targetNode: this.gTexTissueType,
      style: edgeStyle,
      matchClause:
        "(sourceNode:GeneSymbol)<-[:MAPS]-(:Gene)-[:EXPRESSED]->(:GtexDetailedTissue)<-[:PARENT]-(targetNode:GtexTissue)",
      relatedVerb: "expressed",
      relatingVerb: "expressing",
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
