<template>
  <div>
    <div class="graph-component-container" ref="GraphComponentElement">
      <PopupPanel ref="popupPanel">
        <v-card>
          <v-card-text>Hello Popup!</v-card-text>
        </v-card>
      </PopupPanel>
    </div>
    <div
      class="overview-component-container"
      ref="GraphOverviewComponentElement"
    ></div>
    <ContextMenu
      ref="contextMenu"
      @populate-context-menu="actions = getActions($event)"
    >
      <v-list>
        <v-list-item
          v-for="action in actions"
          @click="action.action()"
          :disabled="action.disabled"
        >
          <v-list-item-title>{{ action.title }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="currentItem && selectedItems.length < 1"
          @click="remove([currentItem])"
        >
          <v-list-item-title>Remove Item</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="selectedItems.length > 0"
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
  GraphOverviewComponent,
  RenderModes,
  MouseEventRecognizers,
} from "yfiles";
import ContextMenu from "./ContextMenu";
import PopupPanel from "./PopupPanel";
import { enableWorkarounds } from "./../util/Workarounds";
import {
  CovidGraphLoader,
  edgeStyle,
  edgeLabelStyle,
  edgeLabelLayoutParameter,
} from "../util/CovidGraphLoader";
import { isStagingDb } from "../util/dbconnection";

License.value = licenseData;

let isStaging = isStagingDb();

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

  // move the selection and highlight to the background
  graphComponent.selectionGroup.below(graphComponent.contentGroup);
  graphComponent.highlightGroup.toBack();

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
    dragging: false,
    actions: [],
    currentItem: null,
    selectedItems: [],
    isStaging: isStaging,
  }),
  mounted() {
    this.$graphComponent = new GraphComponent(this.$refs.GraphComponentElement);
    this.$graphOverviewComponent = new GraphOverviewComponent(
      this.$refs.GraphOverviewComponentElement,
      this.$graphComponent
    );
    this.$graphOverviewComponent.renderMode = RenderModes.CANVAS;
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
    const selectionInputMode = viewerInputMode.lassoSelectionInputMode;
    selectionInputMode.enabled = true;
    selectionInputMode.prepareRecognizer =
      MouseEventRecognizers.LEFT_DOUBLE_CLICK;
    selectionInputMode.dragFreeRecognizer = MouseEventRecognizers.MOVE_OR_DRAG;
    selectionInputMode.finishRecognizer = MouseEventRecognizers.LEFT_UP;
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

    viewerInputMode.toolTipItems = GraphItemTypes.NODE | GraphItemTypes.EDGE;

    // move the tooltip slightly away from the mouse cursor
    viewerInputMode.mouseHoverInputMode.toolTipLocationOffset = new Point(
      20,
      20
    );
    viewerInputMode.addQueryItemToolTipListener((sender, evt) => {
      const tooltip = this.loader.getTooltip(evt.item);
      if (tooltip) {
        evt.toolTip = tooltip;
      }
    });

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
    this.loader.registerEvents(this.eventBus);
  },
  methods: {
    getActions: function (item) {
      this.currentItem = item;
      if (this.loader !== null) {
        if (this.selectedItems.length > 1) {
          const createCypherQueryActions = [
            {
              action: () =>
                alert(this.loader.createCypherMatch(this.selectedItems)),
              title: "Show Cypher Query",
            },
          ];
          return this.loader
            .findCommonActions(this.selectedItems)
            .concat(createCypherQueryActions);
        } else if (this.currentItem !== null) {
          const createCypherQueryActions = [
            {
              action: () =>
                alert(this.loader.createCypherMatch(this.currentItem)),
              title: "Show Cypher Query",
            },
          ];
          return this.loader
            .findActions(this.currentItem)
            .concat(createCypherQueryActions);
        }
      }
      return [];
    },
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
    clearGraph() {
      this.loader.clearGraph();
    },
    remove(items) {
      this.loader.remove(items);
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

.overview-component-container {
  padding: 1px;
  border: 1px solid darkgrey;
  background: white;
  position: absolute;
  top: 10px;
  left: 10px;
  width: 200px;
  height: 200px;
}
</style>
