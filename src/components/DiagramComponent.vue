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
  ShapeNodeStyle,
  Point,
  Color,
  StyleDecorationZoomPolicy,
  ShapeNodeShape,
  INode,
  PolylineEdgeStyle,
  Arrow,
  ArrowType,
  Stroke,
  NodeStyleDecorationInstaller,
  EdgeStyleDecorationInstaller,
  IEdge,
} from "yfiles";
import ContextMenu from "./ContextMenu";
import PopupPanel from "./PopupPanel";
import { enableWorkarounds } from "./../util/Workarounds";
import { isOfType } from "../util/queries";
import {
  CovidGraphLoader,
  edgeStyle,
  edgeLabelStyle,
  edgeLabelLayoutParameter,
} from "../util/CovidGraphLoader";

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

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

    this.loader = new CovidGraphLoader(this.$graphComponent);

    const graphModelManager = this.$graphComponent.graphModelManager;
    graphModelManager.edgeLabelGroup.below(graphModelManager.nodeGroup);

    graph.edgeDefaults.style = edgeStyle;
    graph.edgeDefaults.labels.style = edgeLabelStyle;
    graph.edgeDefaults.labels.layoutParameter = edgeLabelLayoutParameter;

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
    this.eventBus.$on("load-author", (authorId) => {
      this.loader.loadAndConnectNodeForSchema(this.loader.authorType, authorId);
    });
    this.eventBus.$on("load-geneSymbol", (id) => {
      this.loader.loadAndConnectNodeForSchema(this.loader.geneSymbolType, id);
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
    clearGraph() {
      this.loader.clearGraph();
    },
    remove(items) {
      this.loader.remove(items);
    },
    async loadPapersForAuthor(author) {
      await this.loader.loadInEdges(author, this.loader.paper_author);
    },
    async loadGenesForPaper(paper) {
      await this.loader.loadOutEdges(paper, this.loader.paper_geneSymbol);
    },
    async loadGenesForPatent(patent) {
      await this.loader.loadOutEdges(patent, this.loader.patent_geneSymbol);
    },
    async loadPapersForGene(gene) {
      await this.loader.loadInEdges(gene, this.loader.paper_geneSymbol);
    },
    async loadPatentsForGene(gene) {
      await this.loader.loadInEdges(gene, this.loader.patent_geneSymbol);
    },
    async loadAuthorsForPaper(paper) {
      await this.loader.loadOutEdges(paper, this.loader.paper_author);
    },
    async loadAffiliationsForPaper(paper) {
      await this.loader.loadOutEdges(paper, this.loader.paper_affiliation);
    },
    async loadPapersForAffiliation(affiliation) {
      await this.loader.loadInEdges(affiliation, this.loader.paper_affiliation);
    },
    async loadReferencedPapersForPaper(paper) {
      await this.loader.loadOutEdges(paper, this.loader.paper_paper);
    },
    async loadReferencingPapersForPaper(paper) {
      await this.loader.loadInEdges(paper, this.loader.paper_paper);
    },
    async loadCommonAffiliationsForPapers(items) {
      await this.loader.loadTargets(items, this.loader.paper_affiliation);
    },
    async loadCommonPapersForAffiliations(items) {
      await this.loader.loadSources(items, this.loader.paper_affiliation);
    },
    async loadCommonGenesForPapers(items) {
      await this.loader.loadTargets(items, this.loader.paper_geneSymbol);
    },
    async loadCommonPapersForGenes(items) {
      await this.loader.loadSources(items, this.loader.paper_geneSymbol);
    },
    async loadCommonPapersForAuthors(items) {
      await this.loader.loadSources(items, this.loader.paper_author);
    },
    async loadCommonAuthorsForPapers(items) {
      await this.loader.loadTargets(items, this.loader.paper_author);
    },
    async loadCommonReferencedPapers(items) {
      await this.loader.loadTargets(items, this.loader.paper_paper);
    },
    async loadCommonReferencingPapers(items) {
      await this.loader.loadSources(items, this.loader.paper_paper);
    },
    async loadCommonGenesForPatents(items) {
      await this.loader.loadTargets(items, this.loader.patent_geneSymbol);
    },
    async loadCommonPatentsForGenes(items) {
      await this.loader.loadSources(items, this.loader.patent_geneSymbol);
    },
    async searchGenes(geneIds) {
      let genes = await this.loader.loadNodesForSchema(
        this.loader.geneSymbolType,
        ["node.sid in $geneIds"],
        { geneIds }
      );
      if (genes.length > 1) {
        await this.loadCommonPapersForGenes(genes);
      } else if (genes.length > 0) {
        await this.loadPapersForGene(genes[0]);
      }
    },
    async searchPatent(id) {
      await this.loader.loadNodeForSchema(this.loader.patentType, id);
    },
    async searchArticle(id) {
      await this.loader.loadNodeForSchema(this.loader.paperType, id);
    },
    async searchAuthor(id) {
      await this.loader.loadNodeForSchema(this.loader.authorType, id);
    },
    async searchAuthorPapers(id) {
      const author = await this.loader.loadNodeForSchema(
        this.loader.authorType,
        id
      );
      await this.loader.loadInEdges(author, this.loader.paper_author);
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
