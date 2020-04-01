<template>
  <v-dialog v-model="showDialog" width="50%">
    <v-card>
      <v-card-title class="primary white--text" primary-title>
        <v-icon color="white">mdi-information-outline</v-icon>
        <span style="margin-left: 10px;">COVID❋GRAPH</span>
        <v-spacer></v-spacer>
        <v-icon color="white" @click="showDialog = false">mdi-close </v-icon>
      </v-card-title>
      <v-card-text
        class="card-text"
        style="margin-top: 30px; margin-bottom: 50px;"
      >
        The
        <a href="https://www.covidgraph.org/" target="_blank">COVID❋GRAPH</a>
        project builds a knowledge graph on COVID-19 from various public
        sources. It combines publications, case statistics, genes, molecular
        data, and many more entities in a Neo4j database.
      </v-card-text>
      <v-card-text class="card-text">
        <h1 style="margin-bottom: 20px;">Covid Graph Explorer</h1>
        Use this application to interactively explore the database. The search
        panel allows for finding specific genes, authors, articles, and patents
        which are loaded into the graph which is visualized with
        <a
          href="https://www.yworks.com/products/yfiles-for-html"
          target="_blank"
          >yFiles for HTML</a
        >. The actions in the context menu and in the details view help
        exploring the database by loading connected entities and clearly
        arranging the graph.
      </v-card-text>
      <v-card-text class="greeting"
        >Enjoy exploring the database and gaining knowledge about COVID-19!<br />
        #fightcorona #flattenthecurve</v-card-text
      >
      <v-card-actions style="align-items: flex-end; padding: 24px;"
        ><v-btn
          outlined
          rounded
          color="primary"
          href="https://www.yworks.com/company/legal/imprint"
          target="_blank"
          class="link-button"
          >Legal Disclosure</v-btn
        ><v-btn
          outlined
          rounded
          color="primary"
          href="https://www.yworks.com/company/legal/terms-of-use"
          target="_blank"
          class="link-button"
          >Terms of Use</v-btn
        >
        <v-btn
          outlined
          rounded
          color="primary"
          href="https://www.yworks.com/company/legal/privacy"
          target="_blank"
          >Privacy Policy</v-btn
        >
        <v-spacer></v-spacer>
        <a href="https://www.yworks.com" target="_blank"
          ><v-img src="../images/yWorks-logo.svg" width="180px"></v-img
        ></a>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "AboutDialog",
  data: () => ({
    showDialog: false,
  }),
  created() {
    this.eventBus.$on("show-about-dialog", () => {
      this.showDialog = true;
    });
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
}
.card-text {
  font-size: large;
  line-height: 3.5ex;
}
.greeting {
  font-size: large;
  font-weight: bold;
}
.link-button {
  margin-right: 10px;
}
</style>
