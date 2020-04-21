<template>
  <v-app>
    <v-app-bar
      app
      clipped-left
      clipped-right
      color="primary"
      style="
        box-shadow: 0 1px 15px rgba(0, 0, 0, 0.04),
          0 1px 6px rgba(0, 0, 0, 0.04);
      "
    >
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            href="https://covidgraph.org"
            target="_blank"
            x-large
            text
            v-on="on"
          >
            <span class="covidgraph-logo-text">COVID</span
            ><v-img
              src="./images/covidgraph-virus-logo.svg"
              class="covidgraph-logo"
            ></v-img>
            <span class="covidgraph-logo-text">GRAPH</span>
          </v-btn>
        </template>
        <span>https://covidgraph.org</span>
      </v-tooltip>
      <v-spacer></v-spacer>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            icon
            rounded
            v-on="on"
            @click="$refs.graphComponent.clearGraph()"
          >
            <v-icon color="white">mdi-delete</v-icon></v-btn
          >
        </template>
        <span>Clear the Graph</span>
      </v-tooltip>
      <ConnectionStatus></ConnectionStatus>
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn text icon color="white" @click="showAboutDialog" v-on="on">
            <v-icon>mdi-information-outline</v-icon>
          </v-btn>
        </template>
        <span>About</span>
      </v-tooltip>
    </v-app-bar>
    <v-navigation-drawer
      app
      left
      clipped
      width="350"
      style="
        box-shadow: 0 3px 30px rgba(0, 0, 0, 0.1), 0 3px 20px rgba(0, 0, 0, 0.1);
      "
    >
      <detail-panel ref="detailsPanel"></detail-panel>
    </v-navigation-drawer>

    <v-navigation-drawer
      app
      clipped
      right
      width="350"
      style="
        box-shadow: 0 1px 15px rgba(0, 0, 0, 0.1), 0 1px 6px rgba(0, 0, 0, 0.1);
      "
    >
      <SearchGene @search-gene="$refs.graphComponent.searchGenes($event)" />
      <SearchArticle
        @search-article="$refs.graphComponent.searchArticle($event)"
      />
      <SearchPatent
        @search-patent="$refs.graphComponent.searchPatent($event)"
      />
      <SearchAuthor
        @search-author="$refs.graphComponent.searchAuthor($event)"
        @search-author-papers="$refs.graphComponent.searchAuthorPapers($event)"
      />
    </v-navigation-drawer>

    <v-content>
      <v-container fluid fill-height>
        <diagram-component
          ref="graphComponent"
          @item-selected="$refs.detailsPanel.show($event)"
        ></diagram-component>
      </v-container>
    </v-content>

    <about-dialog></about-dialog>
  </v-app>
</template>

<script>
import DiagramComponent from "./components/DiagramComponent";
import SearchArticle from "./components/SearchArticle";
import DetailPanel from "./components/DetailPanel";
import SearchGene from "./components/SearchGene";
import SearchAuthor from "./components/SearchAuthor";
import SearchPatent from "./components/SearchPatent";
import ConnectionStatus from "./components/ConnectionStatus";
import AboutDialog from "./components/AboutDialog";

export default {
  name: "app",
  components: {
    AboutDialog,
    ConnectionStatus,
    SearchArticle,
    SearchGene,
    DiagramComponent,
    DetailPanel,
    SearchAuthor,
    SearchPatent,
  },
  mounted() {
    setTimeout(() => this.showAboutDialog(), 500);
  },
  methods: {
    showAboutDialog() {
      this.eventBus.$emit("show-about-dialog");
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Teko");
.covidgraph-logo-text {
  color: white;
  font-family: Teko, sans-serif;
  font-size: 55px;
  font-weight: 400;
  vertical-align: center;
}
.covidgraph-logo {
  width: 35px;
  height: 35px;
  margin-bottom: 5px;
}
</style>
