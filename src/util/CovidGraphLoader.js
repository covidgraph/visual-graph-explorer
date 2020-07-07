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
import TissueNode from "../graph-styles/TissueNode";
import { isStagingDb } from "./dbconnection";
import ClinicalTrialNode from "../graph-styles/ClinicalTrialNode";
import DiseaseNode from "../graph-styles/DiseaseNode";

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

    this.diseaseType = this.addNodeType({
      type: "Disease",
      style: new VuejsNodeStyle(DiseaseNode),
      size: new Size(150, 150),
      singularName: "disease",
      pluralName: "diseases",
    });
    this.clinicalTrialType = this.addNodeType({
      type: "ClinicalTrial",
      style: new VuejsNodeStyle(ClinicalTrialNode),
      size: new Size(150, 150),
      singularName: "clinical trial",
      pluralName: "clinical trials",
    });
    this.facilityType = this.addNodeType({
      type: "Facility",
      style: new ShapeNodeStyle(),
      size: new Size(50, 50),
      labels: (item) => item.properties.facilityName,
      singularName: "facility",
      pluralName: "facilities",
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
    });

    this.gTexDetailedTissueType = this.addNodeType({
      type: "GtexDetailedTissue",
      style: new VuejsNodeStyle(TissueNode),
      size: new Size(150, 150),
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

    this.trial_paper = this.addRelationShip({
      sourceNode: this.clinicalTrialType,
      targetNode: this.paperType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:ClinicalTrial)-[:PUBLISHED]->(targetNode:Paper)",
      relatedVerb: "published",
      relatingVerb: "publishing",
    });
    this.gene_disease = this.addRelationShip({
      sourceNode: this.diseaseType,
      targetNode: this.geneSymbolType,
      style: wroteEdgeStyle,
      matchClause:
        "(sourceNode:Disease)-[:ASSOCIATES_DaG]->(:Gene)-[:MAPS]->(targetNode:GeneSymbol)",
      relatedVerb: "associated",
      relatingVerb: "associated",
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
      style: new PolylineEdgeStyle({ stroke: "2px red" }),
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
