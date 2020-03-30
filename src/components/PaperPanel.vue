<template>
  <v-card>
    <v-list-item>
      <v-icon x-large>mdi-file-document-outline</v-icon>
      <v-list-item-content>
        <v-list-item-title>{{ this.value.properties.title }}</v-list-item-title>
        <v-list-item-subtitle
          >{{ this.value.properties.source_x }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Authors</v-list-item-title>
        <v-list-item-subtitle> </v-list-item-subtitle>
        <v-list-item v-for="author in authors">
          {{ author.properties.first }}
          {{ author.properties.middle }}
          {{ author.properties.last }}
          <a :href="`mailto:` + author.properties.email">
            {{ author.properties.email }}</a
          >
        </v-list-item>
      </v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Published</v-list-item-title>
        <v-list-item-subtitle
          >{{ this.value.properties.publish_time }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>License</v-list-item-title>
        <v-list-item-subtitle
          >{{ this.value.properties.license }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <!--    <v-img
                  src="https://cdn.vuetifyjs.com/images/cards/mountain.jpg"
                  height="194"
                ></v-img>-->

    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Abstract</v-list-item-title>
        <v-list-item-subtitle> </v-list-item-subtitle>
        <v-card-text style="max-height: 300px; overflow-y: auto;">
          {{ abstract }}
        </v-card-text>
      </v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Full Text</v-list-item-title>
        <v-list-item-subtitle> </v-list-item-subtitle>
        <v-card-text style="max-height: 300px; overflow-y: auto;">
          {{ fullText }}
        </v-card-text>
      </v-list-item-content>
    </v-list-item>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Mentioned Genes</v-list-item-title>
        <v-list-item-subtitle> </v-list-item-subtitle>
        <v-list-item-group v-for="geneSymbol in geneSymbols">
          <v-list-item-content>{{ geneSymbol }}</v-list-item-content>
        </v-list-item-group>
      </v-list-item-content>
    </v-list-item>

    <v-card-actions style="flex-flow: wrap;">
      <v-btn text color="#1976d2" @click="loadAuthors">
        Load Authors
      </v-btn>
      <v-btn text color="#1976d2" @click="loadGenes">
        Load Genes
      </v-btn>
      <v-btn text color="#1976d2" @click="loadReferencedPapers">
        Load Referenced Papers
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import query from "../util/dbconnection";
import {
  loadAbstractsForPaper,
  loadAuthorsForPaper,
  loadBodyTextForPaper,
  loadGenesForPaper,
} from "../util/queries";

export default {
  name: "PaperPanel",
  data: () => ({
    abstract: "",
    fullText: "",
    authors: [],
    geneSymbols: [],
  }),
  props: {
    value: null,
  },
  watch: {
    value: function (paper) {
      this.authors = [];
      this.geneSymbols = [];
      if (paper != null) {
        this.abstract = "Loading...";
        this.fullText = "Loading...";
        loadAbstractsForPaper(paper)
          .then((value) => {
            this.abstract = value.map((v) => v.properties.text).join(" ");
          })
          .catch((reason) => {
            this.abstract = "Failed to load " + reason;
          });
        loadBodyTextForPaper(paper)
          .then((value) => {
            this.fullText = value.length > 0 ? value[0][0] : "n/a";
          })
          .catch((reason) => {
            this.fullText = "Failed to load " + reason;
          });
        loadGenesForPaper(paper)
          .then((genes) => {
            this.geneSymbols =
              genes.length > 0 ? genes.map((g) => g.properties.sid) : ["none"];
          })
          .catch((reason) => {
            this.geneSymbols = ["Failed to load " + reason];
          });
        loadAuthorsForPaper(paper)
          .then((authors) => {
            this.authors = authors;
          })
          .catch((reason) => {
            this.authors = [];
          });
      } else {
        this.abstract = "n/a";
        this.fullText = "n/a";
      }
    },
  },
  methods: {
    loadReferencedPapers() {
      this.eventBus.$emit("load-referenced-papers-for-paper", this.value);
    },
    loadAuthors() {
      this.eventBus.$emit("load-authors-for-paper", this.value);
    },
    loadGenes() {
      this.eventBus.$emit("load-genes-for-paper", this.value);
    },
  },
};
</script>

<style scoped></style>
