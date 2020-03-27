<template>
  <div>
    <div class="graph-component-container" ref="GraphComponentElement">
      <PopupPanel ref="popupPanel">
        <v-card>
          <v-card-text>Hello Popup!</v-card-text>
        </v-card>
      </PopupPanel>
    </div>
    <ContextMenu ref="contextMenu">
      <v-list>
        <v-list-item @click="loadReferencedPapers()">
          <v-list-item-title>Load Referenced Papers</v-list-item-title>
        </v-list-item>
        <v-list-item @click="">
          <v-list-item-title>Load Authors</v-list-item-title>
        </v-list-item>
        <v-list-item @click="">
          <v-list-item-title>Load Pages</v-list-item-title>
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
import query from "./../util/dbconnection";
import { createGraphBuilder } from "../util/Neo4jGraphBuilder";
import PopupPanel from "./PopupPanel";

License.value = licenseData;

Class.ensure(LayoutExecutor);

export default {
  name: "DiagramComponent",
  components: {
    PopupPanel,
    ContextMenu,
  },
  mounted() {
    this.$graphComponent = new GraphComponent(this.$refs.GraphComponentElement);
    let viewerInputMode = new GraphViewerInputMode();
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
    this.$graphComponent.inputMode = viewerInputMode;
    viewerInputMode.clickableItems = GraphItemTypes.NODE;
    this.$graphComponent.addCurrentItemChangedListener((sender, evt) => {
      if (sender.currentItem && sender.currentItem.tag) {
        this.$emit("item-selected", sender.currentItem.tag);
      }
    });
    viewerInputMode.addCanvasClickedListener((sender, evt) => {
      this.$refs.popupPanel.hide();
    });
    viewerInputMode.addItemClickedListener((sender, evt) => {
      this.$refs.popupPanel.showPopup(evt.item);
      this.$emit("item-selected", evt.item.tag);
    });
    this.initializeDefaultStyles();
  },
  methods: {
    async loadReferencedPapers() {
      this.$refs.contextMenu.currentItem;
      let paper = this.$graphComponent.graph.nodes.first().tag;
      const referencedPapers = (
        await query(
          "MATCH (n0:Paper)-[r0:PAPER_HAS_BIB_ENTRIES]->(n1:Bib_entries)-[r1:BIB_ENTRIES_HAS_BIBREF]->(n2:Bibref)" +
            "-[r2:BIBREF_HAS_OTHER_IDS]->(n3:Other_ids)-[r3]->(n4:CollectionHub)-[r4]->" +
            "(id)<-[r6:PAPERID_COLLECTION_HAS_PAPERID]-(n5:CollectionHub:PaperID)<-[r5:PAPER_HAS_PAPERID_COLLECTION]-(p:Paper) WHERE id(n0) in $papers AND n0 <> p  RETURN id, p LIMIT 20",
          { papers: [paper.identiy] }
        )
      ).records.map((record) => record.get("p"));

      this.$graphBuilder.nodesSource = this.$graphBuilder.nodesSource.concat(
        referencedPapers
      );
      this.$graphBuilder.updateGraph();
      await this.$graphComponent.morphLayout(new OrganicLayout());
    },
    async searchGene(geneSid) {
      const papers = await this.fetchPapersMentioning(geneSid);
      this.$graphBuilder.nodesSource = this.$graphBuilder.nodesSource.concat(
        papers
      );
      this.$graphBuilder.updateGraph();
      await this.$graphComponent.morphLayout(new OrganicLayout());
    },
    async searchArticle(paper_id) {
      const papers = (
        await query("MATCH (p:Paper) WHERE p.paper_id = $id RETURN p LIMIT 1", {
          id: paper_id,
        })
      ).records.map((record) => record.get("p"));
      papers.forEach((value) => this.$nodes.push(value));
      let graphBuilder = this.$graphBuilder;
      graphBuilder.updateGraph();
      await this.$graphComponent.morphLayout(new OrganicLayout());
    },

    /**
     * Sets default styles for the graph.
     */
    initializeDefaultStyles() {
      this.$graphComponent.graph.nodeDefaults.style = new ShapeNodeStyle({
        fill: "orange",
        stroke: "orange",
        shape: "rectangle",
      });
    },

    async fetchGenes(geneName) {
      return (
        await this.query(
          "MATCH (g:GeneSymbol) Where g.sid = $symbolName RETURN g LIMIT 10",
          { symbolName: geneName }
        )
      ).records.map((record) => record.get("g"));
    },

    async fetchGenes(geneName) {
      return (
        await this.query(
          "MATCH (g:GeneSymbol) Where g.sid = $symbolName RETURN g LIMIT 10",
          { symbolName: geneName }
        )
      ).records.map((record) => record.get("g"));
    },

    async fetchPapersMentioning(sid) {
      return (
        await query(
          "MATCH (p:Paper)-[r:PAPER_HAS_ABSTRACT]->(ch:CollectionHub)-[aa:ABSTRACT_HAS_ABSTRACT]->(a:Abstract)-[m:MENTIONS]->(g:GeneSymbol) WHERE g.sid = $sid RETURN p as node LIMIT 10",
          { sid }
        )
      ).records.map((record) => record.get("node"));
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
