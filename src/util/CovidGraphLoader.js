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
import SchemaBasedLoader, {
  IncrementalGraphLoader,
} from "./schema-based-loader";

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
    super(new SchemaBasedLoader(), graphComponent);

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
      new Size(150, 150)
    );

    const wroteEdgeStyle = new PolylineEdgeStyle({
      stroke: "2px blue",
    });

    this.paper_author = this.addRelationShip(
      this.paperType,
      this.authorType,
      wroteEdgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(targetNode:Author)"
    );

    this.paper_affiliation = this.addRelationShip(
      this.paperType,
      this.affiliationType,
      wroteEdgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation)"
    );

    this.paper_geneSymbol = this.addRelationShip(
      this.paperType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      //"(sourceNode:Paper)-[:PAPER_HAS_ABSTRACT]->(:Abstract:CollectionHub)-[:ABSTRACT_HAS_ABSTRACT]->(:Abstract)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)"
      "(sourceNode:Paper)-[:PAPER_HAS_BODY_TEXT]->(:Body_text:CollectionHub)-[:BODY_TEXT_HAS_BODY_TEXT]->(:Body_text)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)"
    );

    this.patent_geneSymbol = this.addRelationShip(
      this.patentType,
      this.geneSymbolType,
      edgeStyle,
      () => [],
      "(sourceNode:Patent)-[:HAS_DESCRIPTION]->(:PatentDescription)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)"
    );

    this.paper_paper = this.addRelationShip(
      this.paperType,
      this.paperType,
      edgeStyle,
      () => [],
      "(sourceNode:Paper)-[:PAPER_HAS_BIB_ENTRIES]->(:Bib_entries)-[:BIB_ENTRIES_HAS_BIBREF]->(:Bibref)-[:BIBREF_HAS_OTHER_IDS]->(:Other_ids)-->(:CollectionHub)-->(paperId)<-[:PAPERID_COLLECTION_HAS_PAPERID]-(:CollectionHub:PaperID)<-[:PAPER_HAS_PAPERID_COLLECTION]-(targetNode:Paper)"
    );
  }
}
