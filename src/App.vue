<template>
  <v-app>
    <v-navigation-drawer app left clipped width="350">
      <detail-panel ref="detailsPanel"></detail-panel>
    </v-navigation-drawer>
    <v-app-bar app clipped-left clipped-right color="primary">
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
              src="https://covidgraph.org/img/virus-logo.svg"
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
          <v-btn text icon color="white" @click="showAboutDialog" v-on="on">
            <v-icon>mdi-information-outline</v-icon>
          </v-btn>
        </template>
        <span>About</span>
      </v-tooltip>
    </v-app-bar>

    <v-navigation-drawer app permanent clipped right width="310px">
      <SearchGene
        @search-gene="$refs.graphComponent.searchGene($event)"
      ></SearchGene>
      <SearchArticle
        @search-article="$refs.graphComponent.searchArticle($event)"
      >
      </SearchArticle>
      <SearchPatent @search-patent="$refs.graphComponent.searchPatent($event)">
      </SearchPatent>
      <SearchAuthor @search-article="$refs.graphComponent.searchAuthor($event)">
      </SearchAuthor>
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
import AboutDialog from "./components/AboutDialog";

export default {
  name: "app",
  components: {
    AboutDialog,
    SearchArticle,
    SearchGene,
    DiagramComponent,
    DetailPanel,
    SearchAuthor,
    SearchPatent,
  },
  methods: {
    showAboutDialog() {
      this.eventBus.$emit("show-about-dialog");
    },
  },
};
</script>

<style scoped>
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
