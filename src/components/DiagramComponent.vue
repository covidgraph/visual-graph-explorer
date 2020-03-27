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

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

const paperNodeStyle = new ShapeNodeStyle({
  fill: "blue",
  stroke: null,
  shape: "ellipse",
});
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
        labels: [paper.properties.title || "untitled"],
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
      const papers = await this.fetchPapersMentioning(geneSid);
      papers.forEach((p) => this.createPaperNode(p));
      await this.runLayout();
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
