<template>
  <div>
    <div class="graph-component-container" ref="GraphComponentElement">
      <PopupPanel ref="popupPanel">
        <v-card>
          <v-card-text>Hello Popup!</v-card-text>
        </v-card>
      </PopupPanel>
    </div>
    <ContextMenu
      ref="contextMenu"
      @populate-context-menu="currentItem = $event"
    >
      <v-list>
        <v-list-item
          v-if="currentItemIs('Paper')"
          @click="loadReferencedPapersForPaper(currentItem)"
        >
          <v-list-item-title>Load Referenced Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Paper')"
          @click="loadCommonAffiliationsForPapers(selectedItems)"
        >
          <v-list-item-title>Load Common Affiliations</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Affiliation')"
          @click="loadCommonPapersForAffiliations(selectedItems)"
        >
          <v-list-item-title>Load Common Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Paper')"
          @click="loadCommonAuthorsForPapers(selectedItems)"
        >
          <v-list-item-title>Load Common Authors</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Paper')"
          @click="loadCommonReferencedPapers(selectedItems)"
        >
          <v-list-item-title>Load Common References</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Paper')"
          @click="loadCommonReferencingPapers(selectedItems)"
        >
          <v-list-item-title>Load Common Referencing Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Paper')"
          @click="loadCommonGenesForPapers(selectedItems)"
        >
          <v-list-item-title>Load Common Genes</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Patent')"
          @click="loadCommonGenesForPatents(selectedItems)"
        >
          <v-list-item-title>Load Common Genes</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('GeneSymbol')"
          @click="loadCommonPatentsForGenes(selectedItems)"
        >
          <v-list-item-title>Load Common Patents</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('GeneSymbol')"
          @click="loadCommonPapersForGenes(selectedItems)"
        >
          <v-list-item-title>Load Common Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="isMultiSelection('Author')"
          @click="loadCommonPapersForAuthors(selectedItems)"
        >
          <v-list-item-title>Load Common Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Paper')"
          @click="loadReferencingPapersForPaper(currentItem)"
        >
          <v-list-item-title>Load Referencing Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Paper')"
          @click="loadAuthorsForPaper(currentItem)"
        >
          <v-list-item-title>Load Authors</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Paper')"
          @click="loadAffiliationsForPaper(currentItem)"
        >
          <v-list-item-title>Load Affiliations</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Paper')"
          @click="loadGenesForPaper(currentItem)"
        >
          <v-list-item-title>Load Genes</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Patent')"
          @click="loadGenesForPatent(currentItem)"
        >
          <v-list-item-title>Load Genes</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('GeneSymbol')"
          @click="loadPapersForGene(currentItem)"
        >
          <v-list-item-title>Load Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('GeneSymbol')"
          @click="loadPatentsForGene(currentItem)"
        >
          <v-list-item-title>Load Patents</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Author')"
          @click="loadPapersForAuthor(currentItem)"
        >
          <v-list-item-title>Load Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItemIs('Affiliation')"
          @click="loadPapersForAffiliation(currentItem)"
        >
          <v-list-item-title>Load Papers</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItem && selectedItems.length < 1"
          @click="remove([currentItem])"
        >
          <v-list-item-title>Remove Item</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="selectedItems.length > 0 && !currentItem"
          @click="remove(selectedItems)"
        >
          <v-list-item-title>Remove Items</v-list-item-title>
        </v-list-item>
      </v-list>
    </ContextMenu>
  </div>
</template>

<script>
import licenseData from "../../yfiles-license.json";
import {
  Class,
  GraphComponent,
  GraphItemTypes,
  ExteriorLabelModel,
  GraphViewerInputMode,
  LayoutExecutor,
  License,
  OrganicLayout,
  ShapeNodeStyle,
  Size,
  Rect,
  Point,
  Color,
  ComponentArrangementStyles,
  ComponentLayout,
  IVisualTemplate,
  RectangleIndicatorInstaller,
  StyleDecorationZoomPolicy,
  ShapeNodeShape,
  INode,
  PolylineEdgeStyle,
  Arrow,
  ArrowType,
  Stroke,
  DefaultLabelStyle,
  SmartEdgeLabelModel,
  NodeStyleDecorationInstaller,
  EdgeStyleDecorationInstaller,
  IEdge,
} from "yfiles";
import ContextMenu from "./ContextMenu";
import { getId } from "../util/Neo4jGraphBuilder";
import PopupPanel from "./PopupPanel";
import { enableWorkarounds } from "./../util/Workarounds";
import VuejsNodeStyle from "../graph-styles/VuejsNodeStyle.js";
import SchemaBasedLoader from "../util/schema-based-loader";
import PaperNode from "../graph-styles/PaperNode";
import AuthorNode from "../graph-styles/AuthorNode";
import PatentNode from "../graph-styles/PatentNode";
import GeneNode from "../graph-styles/GeneNode";
import { isOfType } from "../util/queries";
import { query } from "../util/queries";

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

const paperNodeStyle = new VuejsNodeStyle(PaperNode);

const patentNodeStyle = new VuejsNodeStyle(PatentNode);

const authorNodeStyle = new VuejsNodeStyle(AuthorNode);

const geneNodeStyle = new VuejsNodeStyle(GeneNode);

/**
 * @param {GraphComponent} graphComponent
 */
function initializeHighlightStyles(graphComponent) {
  // we want to create a non-default nice highlight styling
  // for the hover highlight, create semi transparent orange stroke first
  const orangeRed = Color.ORANGE_RED;
  const orangeStroke = new Stroke(
    orangeRed.r,
    orangeRed.g,
    orangeRed.b,
    220,
    6
  );
  // freeze it for slightly improved performance
  orangeStroke.freeze();

  // now decorate the nodes and edges with custom hover highlight styles
  const decorator = graphComponent.graph.decorator;

  // nodes should be given a rectangular orange rectangle highlight shape
  const highlightShape = new ShapeNodeStyle({
    shape: ShapeNodeShape.ROUND_RECTANGLE,
    stroke: orangeStroke,
    fill: null,
  });

  const nodeStyleHighlight = new NodeStyleDecorationInstaller({
    nodeStyle: highlightShape,
    // that should be slightly larger than the real node
    margins: 15,
    // but have a fixed size in the view coordinates
    zoomPolicy: StyleDecorationZoomPolicy.VIEW_COORDINATES,
  });

  // register it as the default implementation for all nodes
  decorator.nodeDecorator.highlightDecorator.setImplementation(
    nodeStyleHighlight
  );

  // a similar style for the edges, however cropped by the highlight's insets
  const dummyCroppingArrow = new Arrow({
    type: ArrowType.NONE,
    cropLength: 15,
  });
  const edgeStyle = new PolylineEdgeStyle({
    stroke: orangeStroke,
    targetArrow: dummyCroppingArrow,
    sourceArrow: dummyCroppingArrow,
  });
  const edgeStyleHighlight = new EdgeStyleDecorationInstaller({
    edgeStyle,
    zoomPolicy: StyleDecorationZoomPolicy.VIEW_COORDINATES,
  });
  decorator.edgeDecorator.highlightDecorator.setImplementation(
    edgeStyleHighlight
  );
}

const edgeStyle = new PolylineEdgeStyle({
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
const wroteEdgeStyle = new PolylineEdgeStyle({
  stroke: "2px blue",
});
const edgeLabelStyle = new DefaultLabelStyle({
  textFill: "gray",
  textSize: 20,
});
const edgeLabelLayoutParameter = new SmartEdgeLabelModel({
  autoRotation: true,
}).createParameterFromSource({
  distance: 6,
  segmentIndex: 0,
  segmentRatio: 0.5,
});

function createNodeCreator(style, size, labels) {
  return function (item, location) {
    return this.registerNode(
      this.$graphComponent.graph.createNode({
        tag: item,
        layout: Rect.fromCenter(location || Point.ORIGIN, size),
        style: style,
        labels: labels(item),
      }),
      item
    );
  };
}

function createEdgeCreator(style, labels) {
  return function (item, source, target) {
    this.$graphComponent.graph.createEdge({
      source,
      target,
      style,
      labels: labels(item),
      tag: item,
    });
  };
}

let loader = new SchemaBasedLoader();

function addNodeType(type, style, size, labels = null) {
  let node = loader.addNodeType(type);
  node.tag.creator = createNodeCreator(style, size, labels || (() => []));
  node.tag.type = type;
  return node;
}

function addRelationShip(
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
  let edge = loader.addRelationShip(
    relationShipType,
    sourceNode,
    targetNode,
    matchClause
  );
  edge.tag.creator = createEdgeCreator(style || edgeStyle, labels);
  edge.tag.type = relationShipType;
  return edge;
}

let patentType = addNodeType("Patent", patentNodeStyle, new Size(30, 40));
let paperType = addNodeType("Paper", paperNodeStyle, new Size(150, 150));
let authorType = addNodeType("Author", authorNodeStyle, new Size(150, 150));
let affiliationType = addNodeType(
  "Affiliation",
  new ShapeNodeStyle({ stroke: null, fill: "yellow", shape: "ellipse" }),
  new Size(50, 50),
  (affiliation) => [affiliation.properties.institution || "untitled"]
);
let geneSymbolType = addNodeType(
  "GeneSymbol",
  geneNodeStyle,
  new Size(150, 150)
);

let paper_author = addRelationShip(
  paperType,
  authorType,
  wroteEdgeStyle,
  () => [],
  "(sourceNode:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(targetNode:Author)"
);

let paper_affiliation = addRelationShip(
  paperType,
  affiliationType,
  wroteEdgeStyle,
  () => [],
  "(sourceNode:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(:Author)-[:AUTHOR_HAS_AFFILIATION]->(targetNode:Affiliation)"
);

let paper_geneSymbol = addRelationShip(
  paperType,
  geneSymbolType,
  edgeStyle,
  () => [],
  //"(sourceNode:Paper)-[:PAPER_HAS_ABSTRACT]->(:Abstract:CollectionHub)-[:ABSTRACT_HAS_ABSTRACT]->(:Abstract)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)"
  "(sourceNode:Paper)-[:PAPER_HAS_BODY_TEXT]->(:Body_text:CollectionHub)-[:BODY_TEXT_HAS_BODY_TEXT]->(:Body_text)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)"
);

let patent_geneSymbol = addRelationShip(
  patentType,
  geneSymbolType,
  edgeStyle,
  () => [],
  "(sourceNode:Patent)-[:HAS_DESCRIPTION]->(:PatentDescription)-[:HAS_FRAGMENT]->(f)-[:MENTIONS]->(targetNode:GeneSymbol)"
);

let paper_paper = addRelationShip(
  paperType,
  paperType,
  edgeStyle,
  () => [],
  "(sourceNode:Paper)-[:PAPER_HAS_BIB_ENTRIES]->(:Bib_entries)-[:BIB_ENTRIES_HAS_BIBREF]->(:Bibref)-[:BIBREF_HAS_OTHER_IDS]->(:Other_ids)-->(:CollectionHub)-->(paperId)<-[:PAPERID_COLLECTION_HAS_PAPERID]-(:CollectionHub:PaperID)<-[:PAPER_HAS_PAPERID_COLLECTION]-(targetNode:Paper)"
);

export default {
  name: "DiagramComponent",
  components: {
    PopupPanel,
    ContextMenu,
  },
  data: () => ({
    currentItem: null,
    selectedItems: [],
  }),
  mounted() {
    this.$graphComponent = new GraphComponent(this.$refs.GraphComponentElement);
    this.$graphComponent.selection.selectedNodes.addItemSelectionChangedListener(
      (sender, evt) => {
        if (evt.itemSelected) {
          this.selectedItems.push(evt.item.tag);
        } else {
          this.selectedItems.splice(
            this.selectedItems.indexOf(evt.item.tag),
            1
          );
        }
      }
    );

    const graph = this.$graphComponent.graph;
    //graph.decorator.nodeDecorator.selectionDecorator.hideImplementation();

    const graphModelManager = this.$graphComponent.graphModelManager;
    graphModelManager.edgeLabelGroup.below(graphModelManager.nodeGroup);

    graph.edgeDefaults.style = edgeStyle;
    graph.edgeDefaults.labels.style = edgeLabelStyle;
    graph.edgeDefaults.labels.layoutParameter = edgeLabelLayoutParameter;

    this.id2NodeMapping = new Map();
    let viewerInputMode = new GraphViewerInputMode();
    viewerInputMode.contextMenuItems = GraphItemTypes.NODE;
    viewerInputMode.contextMenuInputMode.addPopulateMenuListener(
      (sender, evt) => {
        evt.showMenu = true;
      }
    );
    viewerInputMode.clickableItems = GraphItemTypes.NODE | GraphItemTypes.EDGE;
    viewerInputMode.selectableItems = GraphItemTypes.NODE;
    this.$graphComponent.inputMode = viewerInputMode;

    initializeHighlightStyles(this.$graphComponent);

    // we want to get reports of the mouse being hovered over nodes and edges
    // first enable queries
    viewerInputMode.itemHoverInputMode.enabled = true;
    // set the items to be reported
    viewerInputMode.itemHoverInputMode.hoverItems =
      GraphItemTypes.EDGE | GraphItemTypes.NODE;
    // if there are other items (most importantly labels) in front of edges or nodes
    // they should be discarded, rather than be reported as "null"
    viewerInputMode.itemHoverInputMode.discardInvalidItems = false;
    // whenever the currently hovered item changes call our method
    viewerInputMode.itemHoverInputMode.addHoveredItemChangedListener(
      (sender, evt) => this.onHoveredItemChanged(evt.item)
    );

    viewerInputMode.addItemLeftClickedListener((sender, args) => {
      // Zooms to the suitable point
      if (IEdge.isInstance(args.item)) {
        this.zoomToLocation(args.item, args.location);
      }
    });

    this.$graphComponent.highlightGroup.above(
      this.$graphComponent.graphModelManager.edgeGroup
    );
    this.$graphComponent.selectionGroup.below(
      this.$graphComponent.highlightGroup
    );

    this.$refs.contextMenu.register(this.$graphComponent);
    this.$refs.popupPanel.register(
      this.$graphComponent,
      ExteriorLabelModel.SOUTH_WEST
    );

    this.$graphComponent.addCurrentItemChangedListener((sender, evt) => {
      if (sender.currentItem && sender.currentItem.tag) {
        this.$emit("item-selected", sender.currentItem.tag);
      }
    });
    viewerInputMode.addCanvasClickedListener((sender, evt) => {
      this.$refs.popupPanel.hide();
    });
    viewerInputMode.addItemClickedListener((sender, evt) => {
      //this.$refs.popupPanel.showPopup(evt.item);

      if (INode.isInstance(evt.item)) {
        this.$emit("item-selected", evt.item.tag);
        graphModelManager.getCanvasObject(evt.item).toFront();
      }
    });

    this.eventBus.$on("load-papers-for-gene", (gene) => {
      this.loadPapersForGene(gene);
    });
    this.eventBus.$on("load-patents-for-gene", (gene) => {
      this.loadPatentsForGene(gene);
    });
    this.eventBus.$on("load-papers-for-author", (author) => {
      this.loadPapersForAuthor(author);
    });
    this.eventBus.$on("load-referenced-papers-for-paper", (paper) => {
      this.loadReferencedPapersForPaper(paper);
    });
    this.eventBus.$on("load-referencing-papers-for-paper", (paper) => {
      this.loadReferencingPapersForPaper(paper);
    });
    this.eventBus.$on("load-authors-for-paper", (paper) => {
      this.loadAuthorsForPaper(paper);
    });
    this.eventBus.$on("load-affiliations-for-paper", (paper) => {
      this.loadAffiliationsForPaper(paper);
    });
    this.eventBus.$on("load-papers-for-affiliation", (paper) => {
      this.loadPapersForAffiliation(paper);
    });
    this.eventBus.$on("load-genes-for-paper", (paper) => {
      this.loadGenesForPaper(paper);
    });
  },
  methods: {
    onHoveredItemChanged(item) {
      // we use the highlight manager of the GraphComponent to highlight related items
      const manager = this.$graphComponent.highlightIndicatorManager;

      // first remove previous highlights
      manager.clearHighlights();
      // then see where we are hovering over, now
      const newItem = item;
      if (newItem !== null) {
        // we highlight the item itself
        manager.addHighlight(newItem);
        if (INode.isInstance(newItem)) {
          // and if it's a node, we highlight all adjacent edges, too
          this.$graphComponent.graph.edgesAt(newItem).forEach((edge) => {
            manager.addHighlight(edge);
          });
        } else if (IEdge.isInstance(newItem)) {
          // if it's an edge - we highlight the adjacent nodes
          manager.addHighlight(newItem.sourceNode);
          manager.addHighlight(newItem.targetNode);
        }
      }
    },
    getFocusPoint(item) {
      if (IEdge.isInstance(item)) {
        // If the source and the target node are in the view port, then zoom to the middle point of the edge
        const targetNodeCenter = item.targetNode.layout.center;
        const sourceNodeCenter = item.sourceNode.layout.center;
        const viewport = this.$graphComponent.viewport;
        if (
          viewport.contains(targetNodeCenter) &&
          viewport.contains(sourceNodeCenter)
        ) {
          return new Point(
            (sourceNodeCenter.x + targetNodeCenter.x) / 2,
            (sourceNodeCenter.y + targetNodeCenter.y) / 2
          );
        } else {
          if (
            viewport.center.subtract(targetNodeCenter).vectorLength <
            viewport.center.subtract(sourceNodeCenter).vectorLength
          ) {
            // If the source node is out of the view port, then zoom to it
            return sourceNodeCenter;
          } else {
            // Else zoom to the target node
            return targetNodeCenter;
          }
        }
      } else if (INode.isInstance(item)) {
        return item.layout.center;
      }
    },
    zoomToLocation(item, currentMouseClickLocation) {
      // Get the point where we should zoom in
      const location = this.getFocusPoint(item);
      // Check the type of zooming
      if (false) {
        // The distance between where we clicked and the viewport center
        const offset = currentMouseClickLocation.subtract(
          this.$graphComponent.viewport.center
        );
        // Zooms to the new location of the mouse
        this.$graphComponent.zoomToAnimated(
          location.subtract(offset),
          this.$graphComponent.zoom
        );
      } else {
        this.$graphComponent.zoomToAnimated(
          location,
          this.$graphComponent.zoom
        );
      }
    },

    registerNode(node, item) {
      this.id2NodeMapping.set(getId(item.identity), node);
      return node;
    },
    getLoadedNode(item) {
      return this.id2NodeMapping.get(getId(item.identity));
    },
    getLoadedItemsOfType(schemaNode) {
      return this.$graphComponent.graph.nodes
        .map((n) => n.tag)
        .filter((t) => isOfType(t, schemaNode.tag.type))
        .toArray();
    },
    async loadAndLayout(load) {
      const oldElementCounter =
        this.$graphComponent.graph.nodes.size +
        this.$graphComponent.graph.edges.size;
      const result = await load();
      if (
        this.$graphComponent.graph.nodes.size +
          this.$graphComponent.graph.edges.size >
        oldElementCounter
      ) {
        await this.runLayout();
      }
      return result;
    },
    clearGraph() {
      this.id2NodeMapping.clear();
      this.$graphComponent.graph.clear();
    },
    loadMissingEdges: function (missingEdges, schemaEdge) {
      let graph = this.$graphComponent.graph;
      missingEdges.forEach((missingEdge) => {
        let sourceNode = this.getLoadedNode({
          identity: missingEdge.sourceId,
        });
        let targetNode = this.getLoadedNode({
          identity: missingEdge.targetId,
        });
        if (!graph.getEdge(sourceNode, targetNode)) {
          schemaEdge.tag.creator.call(this, {}, sourceNode, targetNode);
        }
      });
    },
    loadMissingEdgesForSchemaNodes: async function (schemaNode, newItems) {
      if (newItems.length > 0) {
        await Promise.all(
          loader.schemaGraph
            .inEdgesAt(schemaNode)
            .toArray()
            .map(async (schemaEdge) => {
              const missingEdges = await loader.loadMissingEdges(
                schemaEdge,
                this.getLoadedItemsOfType(schemaEdge.sourceNode),
                newItems
              );
              this.loadMissingEdges(missingEdges, schemaEdge);
            })
        );
        await Promise.all(
          loader.schemaGraph
            .outEdgesAt(schemaNode)
            .filter((e) => e.targetNode !== schemaNode)
            .toArray()
            .map(async (schemaEdge) => {
              const missingEdges = await loader.loadMissingEdges(
                schemaEdge,
                newItems,
                this.getLoadedItemsOfType(schemaEdge.targetNode)
              );
              this.loadMissingEdges(missingEdges, schemaEdge);
            })
        );
      }
    },
    async loadInEdges(item, schemaEdge) {
      this.loadAndLayout(async () => {
        const newItems = await this.loadAndConnectSchemaInEdges(
          item,
          schemaEdge,
          schemaEdge.sourceNode.tag.creator.bind(this),
          schemaEdge.tag.creator.bind(this)
        );
        await this.loadMissingEdgesForSchemaNodes(
          schemaEdge.sourceNode,
          newItems
        );
      });
    },
    async loadOutEdges(item, schemaEdge) {
      this.loadAndLayout(async () => {
        const newItems = await this.loadAndConnectSchemaOutEdges(
          item,
          schemaEdge,
          schemaEdge.targetNode.tag.creator.bind(this),
          schemaEdge.tag.creator.bind(this)
        );
        await this.loadMissingEdgesForSchemaNodes(
          schemaEdge.targetNode,
          newItems
        );
      });
    },
    async loadTargets(items, schemaEdge) {
      this.loadAndLayout(async () => {
        const newItems = await this.loadAndConnectSchemaTargets(
          items,
          schemaEdge,
          schemaEdge.targetNode.tag.creator.bind(this),
          schemaEdge.tag.creator.bind(this)
        );
        await this.loadMissingEdgesForSchemaNodes(
          schemaEdge.targetNode,
          newItems
        );
      });
    },
    async loadSources(items, schemaEdge) {
      this.loadAndLayout(async () => {
        const newItems = await this.loadAndConnectSchemaSources(
          items,
          schemaEdge,
          schemaEdge.sourceNode.tag.creator.bind(this),
          schemaEdge.tag.creator.bind(this)
        );
        await this.loadMissingEdgesForSchemaNodes(
          schemaEdge.sourceNode,
          newItems
        );
      });
    },
    async loadEdges(item, schemaEdge) {
      this.loadAndLayout(() =>
        this.loadAndConnectSchemaUndirectedEdges(
          item,
          schemaEdge,
          schemaEdge.sourceNode.tag.creator.bind(this),
          schemaEdge.tag.creator.bind(this)
        )
      );
    },
    async loadPapersForAuthor(author) {
      await this.loadInEdges(author, paper_author);
    },
    async loadGenesForPaper(paper) {
      await this.loadOutEdges(paper, paper_geneSymbol);
    },
    async loadGenesForPatent(patent) {
      await this.loadOutEdges(patent, patent_geneSymbol);
    },
    async loadPapersForGene(gene) {
      await this.loadInEdges(gene, paper_geneSymbol);
    },
    async loadPatentsForGene(gene) {
      await this.loadInEdges(gene, patent_geneSymbol);
    },
    async loadAuthorsForPaper(paper) {
      await this.loadOutEdges(paper, paper_author);
    },
    async loadAffiliationsForPaper(paper) {
      await this.loadOutEdges(paper, paper_affiliation);
    },
    async loadPapersForAffiliation(affiliation) {
      await this.loadInEdges(affiliation, paper_affiliation);
    },
    currentItemIs(type) {
      return isOfType(this.currentItem, type);
    },
    selectionIs(type) {
      return (
        this.selectedItems.length > 0 &&
        this.selectedItems.every((item) => isOfType(item, type))
      );
    },
    isMultiSelection(type) {
      return (
        this.selectedItems.length > 1 &&
        this.selectedItems.every((item) => isOfType(item, type))
      );
    },
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
        let graph = this.$graphComponent.graph;
        (await loader.loadOutEdges(schemaEdge, item)).forEach((item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            if (!graph.getEdge(node, existingNode)) {
              edgeCreator.call(this, item, node, existingNode);
            }
          } else {
            newItems.push(item);
            let newNode = nodeCreator.call(this, item, location);
            if (!graph.getEdge(node, newNode)) {
              edgeCreator.call(this, item, node, newNode);
            }
          }
        });
        return newItems;
      }
    },
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
        let graph = this.$graphComponent.graph;
        (await loader.loadCommonTargets(schemaEdge, items)).forEach((item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            nodes.forEach((node) => {
              if (!graph.getEdge(node, existingNode)) {
                edgeCreator.call(this, item, node, existingNode);
              }
            });
          } else {
            newItems.push(item);
            let newNode = nodeCreator.call(this, item, location);
            nodes.forEach((node) => {
              if (!graph.getEdge(node, newNode)) {
                edgeCreator.call(this, item, node, newNode);
              }
            });
          }
        });
        return newItems;
      }
    },
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
        let graph = this.$graphComponent.graph;
        (await loader.loadCommonSources(schemaEdge, items)).forEach((item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            nodes.forEach((node) => {
              if (!graph.getEdge(existingNode, node)) {
                edgeCreator.call(this, item, existingNode, node);
              }
            });
          } else {
            newItems.push(item);
            let newNode = nodeCreator.call(this, item, location);
            nodes.forEach((node) => {
              if (!graph.getEdge(newNode, node)) {
                edgeCreator.call(this, item, newNode, node);
              }
            });
          }
        });
        return newItems;
      }
    },
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
        let graph = this.$graphComponent.graph;
        (await loader.loadInEdges(schemaEdge, item)).forEach((item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            if (!graph.getEdge(existingNode, node)) {
              edgeCreator.call(this, item, existingNode, node);
            }
          } else {
            newItems.push(item);
            let newNode = nodeCreator.call(this, item, location);
            if (!graph.getEdge(newNode, node)) {
              edgeCreator.call(this, item, newNode, node);
            }
          }
        });
      }
      return newItems;
    },
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
        let graph = this.$graphComponent.graph;
        (await loader.loadOutEdges(schemaEdge, item)).forEach((item) => {
          let existingNode = this.getLoadedNode(item);
          if (existingNode) {
            if (
              !graph.getEdge(existingNode, node) &&
              !graph.getEdge(node, existingNode)
            ) {
              edgeCreator.call(this, item, existingNode, node);
            }
          } else {
            newItems.push(item);
            let newNode = nodeCreator.call(this, item, location);
            if (
              !graph.getEdge(newNode, node) &&
              !graph.getEdge(node, newNode)
            ) {
              edgeCreator.call(this, item, newNode, node);
            }
          }
        });
        return newItems;
      }
    },
    remove(items) {
      items
        .slice()
        .map((item) => this.getLoadedNode(item))
        .filter((node) => node != null)
        .forEach((node) => {
          this.$graphComponent.graph.remove(node);
          this.id2NodeMapping.delete(getId(node.tag.identity));
        });
    },
    /** @param {function():Promise<object[]>} loader */
    async loadNodes(loader, creator) {
      this.loadAndLayout(async () =>
        (await loader())
          .filter((item) => !this.getLoadedNode(item))
          .forEach((item) => creator.call(this, item))
      );
    },
    /** @param {function():Promise<object[]>} loader */
    async loadNodesForSchema(schemaNode, whereClauses, creator) {
      this.loadAndLayout(async () =>
        (await loader.loadNodes(schemaNode, whereClauses))
          .filter((item) => !this.getLoadedNode(item))
          .forEach((item) => creator.call(this, item))
      );
    },
    async loadNodeForSchema(schemaNode, id) {
      return await this.loadAndLayout(async () => {
        let item = await loader.loadNodeById(schemaNode, id);
        if (item && !this.getLoadedNode(item)) {
          schemaNode.tag.creator.call(this, item);
        }
        return item;
      });
    },
    async runLayout() {
      let organicLayout = new OrganicLayout({
        minimumNodeDistance: 100,
      });
      await this.$graphComponent.morphLayout(organicLayout);
    },
    async loadReferencedPapersForPaper(paper) {
      await this.loadOutEdges(paper, paper_paper);
    },
    async loadReferencingPapersForPaper(paper) {
      await this.loadInEdges(paper, paper_paper);
    },
    async loadCommonAffiliationsForPapers(items) {
      await this.loadTargets(items, paper_affiliation);
    },
    async loadCommonPapersForAffiliations(items) {
      await this.loadSources(items, paper_affiliation);
    },
    async loadCommonGenesForPapers(items) {
      await this.loadTargets(items, paper_geneSymbol);
    },
    async loadCommonPapersForGenes(items) {
      await this.loadSources(items, paper_geneSymbol);
    },
    async loadCommonPapersForAuthors(items) {
      await this.loadSources(items, paper_author);
    },
    async loadCommonAuthorsForPapers(items) {
      await this.loadTargets(items, paper_author);
    },
    async loadCommonReferencedPapers(items) {
      await this.loadTargets(items, paper_paper);
    },
    async loadCommonReferencingPapers(items) {
      await this.loadSources(items, paper_paper);
    },
    async loadCommonGenesForPatents(items) {
      await this.loadTargets(items, patent_geneSymbol);
    },
    async loadCommonPatentsForGenes(items) {
      await this.loadSources(items, patent_geneSymbol);
    },
    async searchGenes(geneSids) {
      let genes = [];
      for (let i = 0; i < geneSids.length; i++) {
        const fetchedGenes = await this.fetchGenes(geneSids[i]);
        genes = genes.concat(fetchedGenes);
      }

      for (let i = 0; i < genes.length; i++) {
        const g = genes[i];
        geneSymbolType.tag.creator.call(this, g);
        await this.loadPapersForGene(g);
      }
    },
    async searchPatent(id) {
      await this.loadNodeForSchema(patentType, id);
    },
    async searchArticle(id) {
      await this.loadNodeForSchema(paperType, id);
    },
    async searchAuthor(id) {
      await this.loadNodeForSchema(authorType, id);
    },
    async searchAuthorPapers(id) {
      const author = await this.loadNodeForSchema(authorType, id);
      await this.loadInEdges(author, paper_author);
    },
    async fetchGenes(geneName) {
      return await loader.loadNodes(geneSymbolType, ["node.sid = $geneName"], {
        geneName,
      });
    },
  },
};
</script>

<style scoped>
@import "~yfiles/yfiles.css";
.graph-component-container {
  background: #f8f8f8;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
