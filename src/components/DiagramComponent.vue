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
          v-if="currentItemIs('GeneSymbol')"
          @click="loadPapersForGene(currentItem)"
        >
          <v-list-item-title>Load Papers</v-list-item-title>
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
} from "yfiles";
import ContextMenu from "./ContextMenu";
import {
  loadAuthorsForPaper,
  loadGenesForPaper,
  query,
} from "./../util/queries";
import { createGraphBuilder } from "../util/Neo4jGraphBuilder";
import PopupPanel from "./PopupPanel";
import { enableWorkarounds } from "./../util/Workarounds";
import {
  loadPapersForAuthor,
  loadPapersForGene,
  loadReferencedPapersForPaper,
} from "../util/queries";
import VuejsNodeStyle from "../graph-styles/VuejsNodeStyle.js"

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

const paperNodeStyle = new VuejsNodeStyle(`<g>
<rect fill="white" stroke="#C0C0C0" :width="layout.width" :height="layout.height" rx="30"></rect>
<use href="#book-icon" :width="layout.height" :height="layout.height" fill="#5B9AD9" x="-10" y="0"></use>
<rect fill='transparent' :stroke="selected ? '#5B9AD9' : 'transparent'" stroke-width="3" :width="layout.width-3" :height="layout.height-3" x="1.5" y="1.5" rx="30"></rect>
<svg-text :content="tag.properties.title" x="145" y="25" :width="layout.width - 165" :height="50" :wrapping="4" font-family="Roboto,sans-serif" :font-size="18" :font-style="0" :font-weight="0" :text-decoration="0" fill="#5B9AD9" :opacity="1" visible="true" :clipped="true" align="start" transform=""></svg-text>
<g transform="translate(145 112)">
  <g>
    <use href="#calendar-icon" width="20" height="20" fill="gray"></use>
    <svg-text :content="tag.properties.publish_time" x="25" y="0" style="text-transform: uppercase" :width="80" :height="25" :wrapping="0" font-family="Roboto,sans-serif" :font-size="16" :font-style="0" :font-weight="0" :text-decoration="0" fill="gray" :opacity="1" visible="true" :clipped="true" align="start" transform=""></svg-text>
  </g>
  <g transform="translate(150 0)">
    <use href="#license-icon" width="20" height="20" fill="gray"></use>
    <svg-text :content="tag.properties.license" x="25" y="0" style="text-transform: uppercase" :width="65" :height="25" :wrapping="0" font-family="Roboto,sans-serif" :font-size="16" :font-style="0" :font-weight="0" :text-decoration="0" fill="gray" :opacity="1" visible="true" :clipped="true" align="start" transform=""></svg-text>
  </g>
</g>
<defs>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" id="book-icon"><path d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"/></svg>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" id="calendar-icon"><path d="M400 64h-48V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v52H160V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v52H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 400H54a6 6 0 0 1-6-6V160h352v298a6 6 0 0 1-6 6zm-52.849-200.65L198.842 404.519c-4.705 4.667-12.303 4.637-16.971-.068l-75.091-75.699c-4.667-4.705-4.637-12.303.068-16.971l22.719-22.536c4.705-4.667 12.303-4.637 16.97.069l44.104 44.461 111.072-110.181c4.705-4.667 12.303-4.637 16.971.068l22.536 22.718c4.667 4.705 4.636 12.303-.069 16.97z"/></svg>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" id="license-icon"><path d="M256 336h-.02c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0C-2.06 328.75.02 320.33.02 336H0c0 44.18 57.31 80 128 80s128-35.82 128-80zM128 176l72 144H56l72-144zm511.98 160c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0-87.12 174.26-85.04 165.84-85.04 181.51H384c0 44.18 57.31 80 128 80s128-35.82 128-80h-.02zM440 320l72-144 72 144H440zm88 128H352V153.25c23.51-10.29 41.16-31.48 46.39-57.25H528c8.84 0 16-7.16 16-16V48c0-8.84-7.16-16-16-16H383.64C369.04 12.68 346.09 0 320 0s-49.04 12.68-63.64 32H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h129.61c5.23 25.76 22.87 46.96 46.39 57.25V448H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h416c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"/></svg>
</defs>

</g>`)
const authorNodeStyle = new ShapeNodeStyle({
  fill: "green",
  stroke: null,
  shape: "ellipse",
});
const geneNodeStyle = new ShapeNodeStyle({
  fill: "yellow",
  stroke: null,
  shape: "round-rectangle",
});

export default {
  name: "DiagramComponent",
  components: {
    PopupPanel,
    ContextMenu,
  },
  data: () => ({
    currentItem: null,
  }),
  mounted() {
    this.$graphComponent = new GraphComponent(this.$refs.GraphComponentElement);
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
    });
  },
  methods: {
    createPaperNode(paper) {
      return this.$graphComponent.graph.createNode({
        tag: paper,
        style: paperNodeStyle,
        layout: [0, 0, 400, 150]
      });
    },
    createAuthorNode(author) {
      return this.$graphComponent.graph.createNode({
        tag: author,
        style: authorNodeStyle,
        labels: [author.properties.last || "Anonymous"],
      });
    },
    createGeneNode(gene) {
      return this.$graphComponent.graph.createNode({
        tag: gene,
        style: geneNodeStyle,
        labels: [gene.properties.sid || "Gene"],
      });
    },
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
    async loadPapersForGene(gene) {
      await this.loadAndConnectNodes(
        gene,
        loadPapersForGene,
        this.createPaperNode.bind(this)
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
    async loadAndConnectNodes(item, loader, creator) {
      let node = this.findNode(item);
      (await loader(item)).map(creator).forEach((newNode) => {
        this.$graphComponent.graph.createEdge(node, newNode);
      });
      await this.runLayout();
    },
    async runLayout() {
      await this.$graphComponent.morphLayout(new OrganicLayout());
    },
    findNode(tag) {
      return this.$graphComponent.graph.nodes.first((n) => n.tag === tag);
    },
    async loadReferencedPapersForPaper(paper) {
      let paperNode = this.findNode(paper);
      const referencedPapers = await loadReferencedPapersForPaper(paper);
      referencedPapers
        .map((paper) => this.createPaperNode(paper))
        .forEach((newPaperNode) => {
          let referenceEdge = this.$graphComponent.graph.createEdge({
            source: paperNode,
            target: newPaperNode,
            labels: ["References"],
          });
        });

      await this.runLayout();
    },
    async searchGene(geneSid) {
      const genes = await this.fetchGenes(geneSid);

      for (let i=0; i<genes.length; i++) {
        const g = genes[i];
        this.createGeneNode(g);
        await this.loadPapersForGene(g);
      }
      // const papers = await this.fetchPapersMentioning(geneSid);
      // papers.forEach((p) => this.createPaperNode(p));
      // await this.runLayout();
    },
    async searchArticle(paper_id) {
      const papers = await query(
        "MATCH (p:Paper) WHERE p.paper_id = $id RETURN p as result LIMIT 1",
        {
          id: paper_id,
        }
      );
      papers.forEach((p) => this.createPaperNode(p));
      await this.runLayout();
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
