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
      <CombinedSearch ref="combinedSearch"></CombinedSearch>
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

    <v-main>
      <v-container fluid fill-height>
        <diagram-component
          ref="graphComponent"
          @item-selected="showDetails($event)"
        ></diagram-component>
      </v-container>
    </v-main>

    <about-dialog></about-dialog>
    <results-dialog></results-dialog>
    <error-dialog ref="errorDialog"></error-dialog>
  </v-app>
</template>

<script>
import DiagramComponent from "./components/DiagramComponent";
import DetailPanel from "./components/DetailPanel";
import ConnectionStatus from "./components/ConnectionStatus";
import AboutDialog from "./components/AboutDialog";
import ResultsDialog from "./components/ResultsDialog";
import CombinedSearch from "./components/CombinedSearch";
import ErrorDialog from "./components/ErrorDialog";

export default {
  name: "app",
  components: {
    ErrorDialog,
    CombinedSearch,
    ResultsDialog,
    AboutDialog,
    ConnectionStatus,
    DiagramComponent,
    DetailPanel,
  },
  created() {
    this.eventBus.$on("error", (e) => {
      this.$refs.errorDialog.showError(e);
    });
  },
  mounted() {
    setTimeout(() => this.showAboutDialog(), 500);
    this.$refs["combinedSearch"].configure(this.$refs["graphComponent"].loader);
  },
  methods: {
    showAboutDialog() {
      this.eventBus.$emit("show-about-dialog");
    },
    async showDetails(item) {
      const details = await this.$refs.graphComponent.getDetails(item);
      this.$refs.detailsPanel.show(item, details);
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
