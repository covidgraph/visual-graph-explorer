<template>
  <v-card>
    <v-list-item style="background-color: #5b9ad9; color: white;">
      <v-icon x-large color="white">mdi-book</v-icon>
      <v-list-item-content>
        <v-list-item-title style="color: white;">{{
          this.value.properties.title
        }}</v-list-item-title>
        <v-list-item-subtitle style="color: #dddddd;">
          {{ this.value.properties.source_x }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-card-actions class="wrap-actions">
      <v-spacer></v-spacer>
      <v-btn
        text
        outlined
        rounded
        color="primary"
        @click="loadAuthors"
        class="action-button"
      >
        Load Authors
      </v-btn>
      <v-btn
        text
        outlined
        rounded
        color="primary"
        @click="loadGenes"
        class="action-button"
      >
        Load Genes
      </v-btn>
      <v-btn
        text
        outlined
        rounded
        color="primary"
        @click="loadReferencedPapers"
        class="action-button"
      >
        Load Referenced Papers
      </v-btn>
      <v-btn
        text
        outlined
        rounded
        color="primary"
        @click="loadReferencingPapers"
        class="action-button"
      >
        Load Referencing Papers
      </v-btn>
      <v-btn
        text
        outlined
        rounded
        color="primary"
        @click="loadAffiliations"
        class="action-button"
      >
        Load Affiliations
      </v-btn>
    </v-card-actions>

    <v-expansion-panels v-model="panel" multiple accordion>
      <v-expansion-panel>
        <v-expansion-panel-header>Published</v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ this.value.properties.publish_time }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>Abstract</v-expansion-panel-header>
        <v-expansion-panel-content class="overflow-content">
          {{ abstract }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>Full Text</v-expansion-panel-header>
        <v-expansion-panel-content class="overflow-content">
          {{ fullText }}
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>Mentioned Genes</v-expansion-panel-header>
        <v-expansion-panel-content class="overflow-content">
          <v-chip-group v-for="geneSymbol in geneSymbols">
            <v-chip label>
              <v-avatar left>
                <v-icon color="#BCD104">mdi-dna</v-icon>
              </v-avatar>
              {{ geneSymbol }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>Authors</v-expansion-panel-header>
        <v-expansion-panel-content class="overflow-content">
          <v-chip-group column>
            <v-chip
              link
              v-for="author in authors"
              :key="author.id"
              :href="'mailto\:' + author.properties.email"
              v-if="author.properties.email"
            >
              <v-avatar left>
                <v-icon color="#D12EAE">mdi-account-circle</v-icon>
              </v-avatar>
              {{ author.properties.first }}
              {{ author.properties.middle }}
              {{ author.properties.last }}
              <v-icon right>
                mdi-email-outline
              </v-icon>
            </v-chip>
            <v-chip
              pill
              :ripple="false"
              v-for="author in authors"
              :key="author.id"
              v-else
            >
              <v-avatar left>
                <v-icon color="#D12EAE">mdi-account-circle</v-icon>
              </v-avatar>
              {{ author.properties.first }}
              {{ author.properties.middle }}
              {{ author.properties.last }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>License</v-expansion-panel-header>
        <v-expansion-panel-content>
          {{ this.value.properties.license }}
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
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
    panel: [0, 1, 0, 0, 0, 0],
  }),
  props: {
    value: Object,
  },
  watch: {
    value: {
      immediate: true,
      handler: function (paper) {
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
                genes.length > 0
                  ? genes.map((g) => g.properties.sid)
                  : ["none"];
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
  },
  methods: {
    loadReferencedPapers() {
      this.eventBus.$emit("load-referenced-papers-for-paper", this.value);
    },
    loadReferencingPapers() {
      this.eventBus.$emit("load-referencing-papers-for-paper", this.value);
    },
    loadAffiliations() {
      this.eventBus.$emit("load-affiliations-for-paper", this.value);
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

<style scoped>
.overflow-content {
  max-height: 300px;
  overflow-y: auto;
}
.wrap-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.action-button {
  margin-top: 5px;
  margin-bottom: 5px;
}
</style>
