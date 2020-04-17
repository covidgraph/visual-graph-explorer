<template>
  <v-card flat>
    <v-list class="blue lighten-5 pt-0" two-lines>
      <v-list-item three-line>
        <v-icon x-large class="pr-2" color="#5b9ad9">fas fa-book</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text wrapText">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <h4 v-on="on">
                  {{ value.properties.title }}
                </h4>
              </template>
              <span>{{ value.properties.title }}</span>
            </v-tooltip>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-layout class="blue lighten-5">
      <v-col class="flex-row-reverse d-flex pt-0">
        <v-card-actions class="wrap-actions">
          <v-menu>
            <template v-slot:activator="{ on: menu }">
              <v-btn outlined rounded color="primary" light v-on="{ ...menu }"
                >LOAD MORE</v-btn
              >
            </template>
            <v-list>
              <v-list-item @click="loadAuthors">
                <v-list-item-title class="purple--text"
                  ><b>AUTHORS</b></v-list-item-title
                >
              </v-list-item>
              <v-list-item @click="loadGenes">
                <v-list-item-title class="green--text"
                  ><b>GENES</b></v-list-item-title
                >
              </v-list-item>
              <v-list-item @click="loadReferencedPapers">
                <v-list-item-title class="primary--text"
                  ><b>REFERENCED PAPERS</b></v-list-item-title
                >
              </v-list-item>
              <v-list-item @click="loadReferencingPapers">
                <v-list-item-title class="primary--text"
                  ><b>REFERENCING PAPERS</b></v-list-item-title
                >
              </v-list-item>
              <v-list-item @click="loadAffiliations">
                <v-list-item-title class="yellow--text textStroke"
                  ><b>AFFILIATIONS</b></v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
      </v-col>
    </v-layout>
    <v-expansion-panels v-model="panel" multiple accordion flat>
      <PanelItem
        itemTitle="Published"
        :items="[value.properties.publish_time || 'n/a']"
      />
      <PanelItem itemTitle="Abstract" :items="[abstract]" />
      <PanelItem itemTitle="Full Text" :items="[fullText]" />
      <v-expansion-panel v-if="geneSymbols.length" class="mr-1" flat>
        <v-expansion-panel-header class="primary--text pb-0">
          <b>Mentioned Genes</b>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="grey lighten-5">
          <v-chip-group v-for="(geneSymbol, i) in geneSymbols" :key="i">
            <v-chip label>
              <v-avatar left>
                <v-icon color="#BCD104">mdi-dna</v-icon>
              </v-avatar>
              {{ geneSymbol }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="authors.length" class="mr-1">
        <v-expansion-panel-header class="primary--text pb-0">
          <b>Authors</b>
        </v-expansion-panel-header>
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
              {{ author.properties.middle || "" }}
              {{ author.properties.last }}
            </v-chip>
          </v-chip-group>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <PanelItem
        itemTitle="License"
        v-if="value.properties.license"
        :items="[value.properties.license]"
      />
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
import PanelItem from "./shared/PanelItem";

export default {
  name: "PaperPanel",
  components: {
    PanelItem,
  },
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
  max-height: 350px;
  overflow-y: auto;
}
.wrap-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.wrapText {
  white-space: normal !important;
}
.textStroke {
  -webkit-text-stroke: 0.4px gray;
}
</style>
