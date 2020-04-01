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
import { getId } from "../util/Neo4jGraphBuilder";
import PopupPanel from "./PopupPanel";
import { enableWorkarounds } from "./../util/Workarounds";
import VuejsNodeStyle from "../graph-styles/VuejsNodeStyle.js";
import SchemaBasedLoader from "../util/schema-based-loader";
import PaperNode from "../graph-styles/PaperNode";
import AuthorNode from "../graph-styles/AuthorNode";
import GeneNode from "../graph-styles/GeneNode";
import { isOfType } from "../util/queries";

License.value = licenseData;

enableWorkarounds();

Class.ensure(LayoutExecutor);

const paperNodeStyle = new VuejsNodeStyle(PaperNode);

const patentNodeStyle = new ShapeNodeStyle({
  fill: "red",
  stroke: null,
  shape: "rectangle",
});
const authorNodeStyle = new VuejsNodeStyle(AuthorNode);

const geneNodeStyle = new VuejsNodeStyle(GeneNode);

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

let patentType = addNodeType(
  "Patent",
  patentNodeStyle,
  new Size(30, 40),
  (patent) => [patent.properties.Title || "untitled"]
);
let paperType = addNodeType("Paper", paperNodeStyle, new Size(150, 150));
let authorType = addNodeType("Author", authorNodeStyle, new Size(150, 150));
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

let paper_geneSymbol = addRelationShip(
  paperType,
  geneSymbolType,
  edgeStyle,
  () => [],
  "(sourceNode:Paper)-[:MENTIONS]->(targetNode:GeneSymbol)"
);

let patent_geneSymbol = addRelationShip(
  patentType,
  geneSymbolType,
  edgeStyle,
  () => [],
  "(sourceNode:Patent)-[:HAS_DESCRIPTION]->(:PatentDescription)-[:MENTIONS]->(targetNode:GeneSymbol)"
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
    this.eventBus.$on("load-patents-for-gene", (gene) => {
      this.loadPatentsForGene(gene);
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
    getLoadedItemsOfType(schemaNode) {
      return this.$graphComponent.graph.nodes
        .map((n) => n.tag)
        .filter((t) => isOfType(t, schemaNode.tag.type))
        .toArray();
    },
    async loadAndLayout(load) {
      const oldlementCounter =
        this.$graphComponent.graph.nodes.size +
        this.$graphComponent.graph.edges.size;
      await load();
      if (
        this.$graphComponent.graph.nodes.size +
          this.$graphComponent.graph.edges.size >
        oldlementCounter
      ) {
        await this.runLayout();
      }
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
    currentItemIs(type) {
      return isOfType(this.currentItem, type);
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
      this.loadAndLayout(async () => {
        let item = await loader.loadNodeById(schemaNode, id);
        if (item && !this.getLoadedNode(item)) {
          schemaNode.tag.creator.call(this, item);
        }
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
    async searchGene(geneSid) {
      const genes = await this.fetchGenes(geneSid);
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
