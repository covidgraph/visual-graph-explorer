<template>
  <v-app>
    <v-navigation-drawer app left clipped width="350">
      <detail-panel ref="detailsPanel"></detail-panel>
    </v-navigation-drawer>
    <v-app-bar app clipped-left color="primary" dark>
      <v-spacer></v-spacer>
      <v-btn href="https://covidgraph.org" target="_blank" text>
        <span class="mr-2">covidgraph.org</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer app permanent right>
      <SearchGene
        @search-gene="$refs.graphComponent.searchGene($event)"
      ></SearchGene>
      <SearchArticle
        @search-article="$refs.graphComponent.searchArticle($event)"
      >
      </SearchArticle>
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
  </v-app>
</template>

<script>
import DiagramComponent from "./components/DiagramComponent";
import SearchArticle from "./components/SearchArticle";
import DetailPanel from "./components/DetailPanel";
import SearchGene from "./components/SearchGene";
import SearchAuthor from "./components/SearchAuthor";

export default {
  name: "app",
  components: {
    SearchArticle,
    SearchGene,
    DiagramComponent,
    DetailPanel,
    SearchAuthor,
  },
};
</script>
