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

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

const paperNodeStyle = new ShapeNodeStyle({
  fill: "blue",
  stroke: null,
  shape: "ellipse",
});
const patentNodeStyle = new ShapeNodeStyle({
  fill: "red",
  stroke: null,
  shape: "rectangle",
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
      new Size(40, 40),
      (paper) => [paper.properties.title || "untitled"]
    ),
    createPatentNode: createNodeCreator(
      patentNodeStyle,
      new Size(30, 40),
      (patent) => [patent.properties.Title || "untitled"]
    ),
    createAuthorNode: createNodeCreator(
      authorNodeStyle,
      new Size(35, 35),
      (author) => [author.properties.last || "Anonymous"]
    ),
    createGeneNode: createNodeCreator(
      geneNodeStyle,
      new Size(30, 30),
      (gene) => [gene.properties.sid || "Gene"]
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
      let organicLayout = new OrganicLayout();
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
      await this.loadNodes(
        this.fetchPapersMentioning.bind(this, geneSid),
        this.createPaperNode.bind(this)
      );
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
