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
          v-if="currentItemIs('Paper')"
          @click="loadAuthorsForPaper(currentItem)"
        >
          <v-list-item-title>Load Authors</v-list-item-title>
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
      </v-list>
    </ContextMenu>
  </div>
</template>

<script>
import licenseData from "../../yfiles-license.json";
import {
  Class,
  GraphBuilder,
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
  ComponentArrangementStyles,
  ComponentLayout,
  IVisualTemplate,
  RectangleIndicatorInstaller,
  INode,
  PolylineEdgeStyle,
  Arrow,
  ArrowType,
  Stroke,
  DefaultLabelStyle,
  SmartEdgeLabelModel,
} from "yfiles";
import ContextMenu from "./ContextMenu";
import {
  loadAuthorsForPaper,
  loadGenesForPaper,
  query,
} from "./../util/queries";
import { createGraphBuilder, getId } from "../util/Neo4jGraphBuilder";
import PopupPanel from "./PopupPanel";
import { enableWorkarounds } from "./../util/Workarounds";
import {
  loadPapersForAuthor,
  loadPapersForGene,
  loadReferencedPapersForPaper,
  loadGenesForPatent,
  loadPatentsForGene,
} from "../util/queries";
import VuejsNodeStyle from "../graph-styles/VuejsNodeStyle.js";

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

const paperNodeStyle = new VuejsNodeStyle(`<g>
<g v-if="zoom >= 0.4">
  <g :transform="\`translate(100 0) scale(\${selected && zoom >= 0.5 ? 1 : 0} 1)\`" style="transition: transform 0.3s ease-out;">
    <rect fill='white' stroke="#5B9AD9" stroke-width="3" width="310" :height="layout.height - 3" x="1.5" y="1.5" rx="30"></rect>
    <svg-text :content="tag.properties.title" x="50" y="15" :width="400 - 165" :height="75" :wrapping="4" font-family="Roboto,sans-serif" :font-size="18" :font-style="0" :font-weight="0" :text-decoration="0" fill="#5B9AD9" :opacity="1" visible="true" :clipped="true" align="start" transform=""></svg-text>
    <g transform="translate(50 112)">
      <g>
        <use href="#calendar-icon" width="20" height="20" fill="gray"></use>
        <svg-text :content="tag.properties.publish_time || '-'" x="25" y="0" style="text-transform: uppercase" :width="80" :height="25" :wrapping="0" font-family="Roboto,sans-serif" :font-size="16" :font-style="0" :font-weight="0" :text-decoration="0" fill="gray" :opacity="1" visible="true" :clipped="true" align="start" transform=""></svg-text>
      </g>
      <g transform="translate(140 0)">
        <use href="#license-icon" width="20" height="20" fill="gray"></use>
        <svg-text :content="tag.properties.license" x="25" y="0" style="text-transform: uppercase" :width="75" :height="25" :wrapping="0" font-family="Roboto,sans-serif" :font-size="16" :font-style="0" :font-weight="0" :text-decoration="0" fill="gray" :opacity="1" visible="true" :clipped="true" align="start" transform=""></svg-text>
      </g>
    </g>
  </g>
  <rect fill="white" x="10" y="10" :width="layout.height - 40" :height="layout.height - 20"></rect>
</g>
<use href="#book-icon" :width="layout.height" :height="layout.height" fill="#5B9AD9" x="0" y="0"></use>
<template v-if="zoom >= 0.5">
  <rect fill="#5B9AD9" x="20" y="10" :width="layout.height - 40" :height="layout.height - 80"></rect>
  <svg-text :content="tag.properties.title" x="10" y="30" :width="layout.width - 18" :height="50" :wrapping="2" font-family="Roboto,sans-serif" :font-size="16" :font-style="0" :font-weight="0" :text-decoration="0" fill="white" :opacity="1" visible="true" :clipped="true" align="middle" transform=""></svg-text>
</template>
<defs>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" id="book-icon"><path d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"/></svg>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" id="calendar-icon"><path d="M400 64h-48V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v52H160V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v52H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 400H54a6 6 0 0 1-6-6V160h352v298a6 6 0 0 1-6 6zm-52.849-200.65L198.842 404.519c-4.705 4.667-12.303 4.637-16.971-.068l-75.091-75.699c-4.667-4.705-4.637-12.303.068-16.971l22.719-22.536c4.705-4.667 12.303-4.637 16.97.069l44.104 44.461 111.072-110.181c4.705-4.667 12.303-4.637 16.971.068l22.536 22.718c4.667 4.705 4.636 12.303-.069 16.97z"/></svg>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" id="license-icon"><path d="M256 336h-.02c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0C-2.06 328.75.02 320.33.02 336H0c0 44.18 57.31 80 128 80s128-35.82 128-80zM128 176l72 144H56l72-144zm511.98 160c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0-87.12 174.26-85.04 165.84-85.04 181.51H384c0 44.18 57.31 80 128 80s128-35.82 128-80h-.02zM440 320l72-144 72 144H440zm88 128H352V153.25c23.51-10.29 41.16-31.48 46.39-57.25H528c8.84 0 16-7.16 16-16V48c0-8.84-7.16-16-16-16H383.64C369.04 12.68 346.09 0 320 0s-49.04 12.68-63.64 32H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h129.61c5.23 25.76 22.87 46.96 46.39 57.25V448H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h416c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"/></svg>
</defs>

</g>`);

const patentNodeStyle = new ShapeNodeStyle({
  fill: "red",
  stroke: null,
  shape: "rectangle",
});
const authorNodeStyle = new VuejsNodeStyle(`<g>
<use href="#author-icon" :width="layout.height" :height="layout.height" fill="#D12EAE" x="0" y="0"></use>
<template v-if="zoom >= 0.5">
  <svg-text stroke="#D12EAE" stroke-width="6" :content="[tag.properties.first, tag.properties.middle, tag.properties.last].filter(n=>n).join(' ')" x="0" y="110" :width="layout.width" :height="25" :wrapping="0" font-family="Roboto,sans-serif" :font-size="20" :font-style="0" :font-weight="0" :text-decoration="0" fill="white" :opacity="1" visible="true" :clipped="false" align="middle" transform=""></svg-text>
  <svg-text :content="[tag.properties.first, tag.properties.middle, tag.properties.last].filter(n=>n).join(' ')" x="0" y="110" :width="layout.width" :height="25" :wrapping="0" font-family="Roboto,sans-serif" :font-size="20" :font-style="0" :font-weight="0" :text-decoration="0" fill="white" :opacity="1" visible="true" :clipped="false" align="middle" transform=""></svg-text>
</template>
<template v-if="0.2 < zoom && zoom < 0.5">
  <svg-text :content="tag.properties.last || tag.properties.first || 'Anonymous'" x="0" y="100" :width="layout.width" :height="50" :wrapping="0" font-family="Roboto,sans-serif" :font-size="32" :font-style="0" :font-weight="1" :text-decoration="0" fill="white" :opacity="1" visible="true" :clipped="false" align="middle" transform=""></svg-text>
</template>
<defs>
  <svg id="author-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/></svg>
</defs>
</g>
`);

const geneNodeStyle = new VuejsNodeStyle(`<g>
<use href="#dna-icon" :width="layout.height" :height="layout.height" fill="#BCD104" x="0" y="0"></use>
<template v-if="zoom >= 0.2">
  <svg-text :content="tag.properties.sid || 'Gene'" x="0" :y="layout.height" :width="layout.width" :height="50" :wrapping="0" font-family="Roboto,sans-serif" :font-size="32" :font-style="0" :font-weight="1" :text-decoration="0" fill="black" :opacity="1" visible="true" :clipped="false" align="middle" transform=""></svg-text>
</template>
<defs>
  <svg id="dna-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M.1 494.1c-1.1 9.5 6.3 17.8 15.9 17.8l32.3.1c8.1 0 14.9-5.9 16-13.9.7-4.9 1.8-11.1 3.4-18.1H380c1.6 6.9 2.9 13.2 3.5 18.1 1.1 8 7.9 14 16 13.9l32.3-.1c9.6 0 17.1-8.3 15.9-17.8-4.6-37.9-25.6-129-118.9-207.7-17.6 12.4-37.1 24.2-58.5 35.4 6.2 4.6 11.4 9.4 17 14.2H159.7c21.3-18.1 47-35.6 78.7-51.4C410.5 199.1 442.1 65.8 447.9 17.9 449 8.4 441.6.1 432 .1L399.6 0c-8.1 0-14.9 5.9-16 13.9-.7 4.9-1.8 11.1-3.4 18.1H67.8c-1.6-7-2.7-13.1-3.4-18.1-1.1-8-7.9-14-16-13.9L16.1.1C6.5.1-1 8.4.1 17.9 5.3 60.8 31.4 171.8 160 256 31.5 340.2 5.3 451.2.1 494.1zM224 219.6c-25.1-13.7-46.4-28.4-64.3-43.6h128.5c-17.8 15.2-39.1 30-64.2 43.6zM355.1 96c-5.8 10.4-12.8 21.1-21 32H114c-8.3-10.9-15.3-21.6-21-32h262.1zM92.9 416c5.8-10.4 12.8-21.1 21-32h219.4c8.3 10.9 15.4 21.6 21.2 32H92.9z"/></svg>
</defs>
</g>`);

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

export default {
  name: "DiagramComponent",
  components: {
    PopupPanel,
    ContextMenu,
  },
  data: () => ({
    currentItem: null,
    /** {@type Map} */
    id2NodeMapping: null,
  }),
  mounted() {
    this.$graphComponent = new GraphComponent(this.$refs.GraphComponentElement);

    const graph = this.$graphComponent.graph;
    graph.decorator.nodeDecorator.selectionDecorator.hideImplementation();
    graph.decorator.nodeDecorator.focusIndicatorDecorator.hideImplementation();
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
    viewerInputMode.clickableItems = GraphItemTypes.NODE;
    this.$graphComponent.inputMode = viewerInputMode;

    this.$graphBuilder = createGraphBuilder(
      this.$graphComponent,
      (this.$nodes = []),
      (this.$edges = [])
    );
    this.$graphBuilder.buildGraph();

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
      this.$emit("item-selected", evt.item.tag);

      if (INode.isInstance(evt.item)) {
        graphModelManager.getCanvasObject(evt.item).toFront();
      }
    });

    this.eventBus.$on("load-papers-for-gene", (gene) => {
      this.loadPapersForGene(gene);
    });
    this.eventBus.$on("load-papers-for-author", (author) => {
      this.loadPapersForAuthor(author);
    });
    this.eventBus.$on("load-referenced-papers-for-paper", (paper) => {
      this.loadReferencedPapersForPaper(paper);
    });
    this.eventBus.$on("load-authors-for-paper", (paper) => {
      this.loadAuthorsForPaper(paper);
    });
    this.eventBus.$on("load-genes-for-paper", (paper) => {
      this.loadGenesForPaper(paper);
    });
  },
  methods: {
    registerNode(node, item) {
      this.id2NodeMapping.set(getId(item.identity), node);
      return node;
    },
    getLoadedNode(item) {
      return this.id2NodeMapping.get(getId(item.identity));
    },
    createPaperNode: createNodeCreator(
      paperNodeStyle,
      new Size(150, 150),
      () => []
    ),
    createPatentNode: createNodeCreator(
      patentNodeStyle,
      new Size(30, 40),
      (patent) => [patent.properties.Title || "untitled"]
    ),
    createAuthorNode: createNodeCreator(
      authorNodeStyle,
      new Size(150, 150),
      () => []
    ),
    createGeneNode: createNodeCreator(
      geneNodeStyle,
      new Size(150, 150),
      () => []
    ),
    async loadPapersForAuthor(author) {
      await this.loadAndConnectNodes(
        author,
        loadPapersForAuthor,
        this.createPaperNode.bind(this)
      );
    },
    async loadGenesForPaper(paper) {
      await this.loadAndConnectNodes(
        paper,
        loadGenesForPaper,
        this.createGeneNode.bind(this)
      );
    },
    async loadGenesForPatent(patent) {
      await this.loadAndConnectNodes(
        patent,
        loadGenesForPatent,
        this.createGeneNode.bind(this)
      );
    },
    async loadPapersForGene(gene) {
      await this.loadAndConnectNodes(
        gene,
        loadPapersForGene,
        this.createPaperNode.bind(this)
      );
    },
    async loadPatentsForGene(gene) {
      await this.loadAndConnectNodes(
        gene,
        loadPatentsForGene,
        this.createPatentNode.bind(this)
      );
    },
    async loadAuthorsForPaper(paper) {
      await this.loadAndConnectNodes(
        paper,
        loadAuthorsForPaper,
        this.createAuthorNode.bind(this)
      );
    },
    currentItemIs(type) {
      return (
        this.currentItem &&
        this.currentItem.labels &&
        this.currentItem.labels.indexOf(type) >= 0
      );
    },
    async loadAndConnectNodes(item, loader, creator, labels = []) {
      let node = this.getLoadedNode(item);
      if (node) {
        let location = node.layout.center.toPoint();
        let graph = this.$graphComponent.graph;
        let newElementCounter = 0;
        (await loader(item))
          .filter((item) => {
            let existingNode = this.getLoadedNode(item);
            if (existingNode) {
              if (!graph.getEdge(node, existingNode)) {
                newElementCounter++;
                graph.createEdge({
                  source: node,
                  target: existingNode,
                  labels,
                });
              }
              return false;
            } else {
              return true;
            }
          })
          .map((item) => creator(item, location))
          .forEach((newNode) => {
            newElementCounter++;
            if (!graph.getEdge(node, newNode)) {
              newElementCounter++;
              graph.createEdge({ source: node, target: newNode, labels });
            }
          });
        if (newElementCounter > 0) {
          await this.runLayout();
        }
      }
    },
    async loadNodes(/** {@type Promise<object[]>} */ loader, creator) {
      (await loader())
        .filter((item) => !this.getLoadedNode(item))
        .forEach((item) => creator(item));
      await this.runLayout();
    },
    async runLayout() {
      let organicLayout = new OrganicLayout({
        minimumNodeDistance: 100,
      });
      await this.$graphComponent.morphLayout(organicLayout);
    },
    async loadReferencedPapersForPaper(paper) {
      await this.loadAndConnectNodes(
        paper,
        loadReferencedPapersForPaper,
        this.createPaperNode.bind(this),
        ["References"]
      );
    },
    async searchGene(geneSid) {
      const genes = await this.fetchGenes(geneSid);

      for (let i = 0; i < genes.length; i++) {
        const g = genes[i];
        this.createGeneNode(g);
        await this.loadPapersForGene(g);
      }
    },
    async searchPatent(id) {
      this.loadNodes(
        () =>
          query(
            "MATCH (p:Patent) WHERE id(p) = $id RETURN p as result LIMIT 1",
            {
              id,
            }
          ),
        this.createPatentNode.bind(this)
      );
    },
    async searchArticle(paper_id) {
      this.loadNodes(
        () =>
          query(
            "MATCH (p:Paper) WHERE p.paper_id = $id RETURN p as result LIMIT 1",
            {
              id: paper_id,
            }
          ),
        this.createPaperNode.bind(this)
      );
    },
    async searchAuthor(id) {
      this.loadNodes(
        () =>
          query(
            "MATCH (a:Author) WHERE id(a) = $id RETURN a as result LIMIT 1",
            {
              id,
            }
          ),
        this.createAuthorNode.bind(this)
      );
    },
    async fetchGenes(geneName) {
      return await query(
        "MATCH (g:GeneSymbol) Where g.sid = $symbolName RETURN g as result LIMIT 10",
        { symbolName: geneName }
      );
    },
    async fetchPapersMentioning(sid) {
      return await query(
        "MATCH (p:Paper)-[m:MENTIONS]->(g:GeneSymbol) WHERE g.sid = $sid RETURN p as result LIMIT 100",
        { sid }
      );
    },
  },
};
</script>

<style scoped>
@import "~yfiles/yfiles.css";
.graph-component-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
