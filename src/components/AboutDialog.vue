<template>
  <v-dialog v-model="showDialog" width="50%">
    <v-card>
      <v-card-title class="primary white--text" primary-title>
        <v-icon color="white">mdi-information-outline</v-icon>
        <v-btn
          href="https://covidgraph.org"
          target="_blank"
          x-large
          text
          v-on="on"
        >
          <span class="covidgraph-logo-text">COVID</span
          ><v-img
            src="../images/covidgraph-virus-logo.svg"
            class="covidgraph-logo"
          ></v-img>
          <span class="covidgraph-logo-text">GRAPH</span>
        </v-btn>
        <v-spacer></v-spacer>
        <v-icon color="white" @click="showDialog = false">mdi-close </v-icon>
      </v-card-title>
      <v-card-text class="card-text" style="padding-top: 20px;">
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

      <v-card-text class="card-text">
        <h2 style="margin-bottom: 20px;">Spread the knowledge!</h2>
        Please share this project with your friends! The world is a graph and
        your network also contains scientists and researchers that can benefit
        from this project. Help with their fight against the pandemic!
      </v-card-text>
      <v-card-actions style="align-items: flex-end; padding: 24px;">
        <v-btn
          rounded
          color="primary"
          href="https://twitter.com/intent/tweet?text=Check%20out%20and%20share%20this%20tool%20with%20your%20friends%20to%20help%20fight%20the%20corona%20virus!%20%23fightcorona%20%23flattenthecurve%0Ahttps%3A//live.yworks.com/covidgraph/"
          target="_blank"
          class="link-button"
          >Share via Twitter </v-btn
        ><v-btn
          rounded
          color="primary"
          href="https://www.reddit.com/submit?url=https%3A//live.yworks.com/covidgraph/&title=Knowledge%20graphs%20to%20fight%20corona"
          target="_blank"
          class="link-button"
          >Share via Reddit </v-btn
        ><v-btn
          rounded
          color="primary"
          href="https://www.facebook.com/sharer/sharer.php?u=https%3A//live.yworks.com/covidgraph/"
          target="_blank"
          class="link-button"
          >Share on Facebook
        </v-btn>
      </v-card-actions>

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
