<template>
  <item-panel-base :title="''" icon="fas fa-book" icon-color="#5b9ad9">
    <template #title>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <h4 v-on="on">
            {{ value.properties.title }}
          </h4>
          <a :href="value.properties.url" target="_blank">{{
            value.properties.url
          }}</a>
        </template>
        <span>{{ value.properties.title }}</span>
      </v-tooltip>
    </template>
    <template #menu>
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
        <v-list-item @click="loadClinicalTrials">
          <v-list-item-title class="yellow--text textStroke"
            ><b>CLINICAL TRIALS</b></v-list-item-title
          >
        </v-list-item>
      </v-list>
    </template>
    <template>
      <PanelItem
        itemTitle="Published"
        :items="[
          (value.properties.publish_time || 'n/a') +
            ` in ` +
            value.properties.journal,
        ]"
      />
      <PanelItem
        v-if="abstract && abstract.length > 0"
        temTitle="Abstract"
        :items="[abstract]"
      />
      <PanelItem
        v-if="fullText && fullText.length > 0"
        itemTitle="Full Text"
        :items="[fullText]"
      />
      <PanelItem itemTitle="Mentioned Genes" :items="geneSymbols">
        <template #content>
          <gene-symbol-list :geneSymbols="geneSymbols" />
        </template>
      </PanelItem>
      <PanelItem itemTitle="Authors" :items="authors" v-slot:default="{ item }">
        <v-chip
          link
          close
          close-icon="mdi-download"
          :href="
            item.properties.email ? 'mailto\:' + item.properties.email : null
          "
          @click:close="loadAuthor(item.identity)"
        >
          <v-avatar left>
            <v-icon color="#D12EAE">mdi-account-circle</v-icon>
          </v-avatar>
          {{ item.properties.first }}
          {{ item.properties.middle }}
          {{ item.properties.last }}
          <v-icon v-if="item.properties.email" right>
            mdi-email-outline
          </v-icon>
        </v-chip>
      </PanelItem>
      <PanelItem
        itemTitle="License"
        v-if="value.properties.license"
        :items="[value.properties.license]"
      />
    </template>
  </item-panel-base>
</template>

<script>
import { isStagingDb } from "../util/dbconnection";
import {
  loadAbstractsForPaper,
  loadAuthorsForPaper,
  loadBodyTextForPaper,
  loadGenesForPaper,
} from "../util/queries";
import PanelItem from "./shared/PanelItem";
import ItemPanelBase from "./shared/ItemPanelBase";
import GeneSymbolList from "./shared/GeneSymbolList";

export default {
  name: "PaperPanel",
  components: {
    GeneSymbolList,
    PanelItem,
    ItemPanelBase,
  },
  data: () => ({
    abstract: "",
    fullText: "",
    authors: [],
    geneSymbols: [],
  }),
  props: {
    value: Object,
  },
  computed: {
    staging: function () {
      return isStagingDb();
    },
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
              this.geneSymbols = genes;
            })
            .catch((reason) => {
              this.geneSymbols = [];
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
    loadAuthor(authorId) {
      this.eventBus.$emit("load-Author", authorId);
    },
    loadGeneSymbol(id) {
      this.eventBus.$emit("load-GeneSymbol", id);
    },
    loadReferencedPapers() {
      this.eventBus.$emit("load-target-Paper-for-Paper", this.value);
    },
    loadReferencingPapers() {
      this.eventBus.$emit("load-source-Paper-for-Paper", this.value);
    },
    loadAffiliations() {
      this.eventBus.$emit("load-target-Affiliation-for-Paper", this.value);
    },
    loadClinicalTrials() {
      this.eventBus.$emit("load-source-ClinicalTrial-for-Paper", this.value);
    },
    loadAuthors() {
      this.eventBus.$emit("load-target-Author-for-Paper", this.value);
    },
    loadGenes() {
      this.eventBus.$emit("load-target-GeneSymbol-for-Paper", this.value);
    },
  },
};
</script>

<style scoped>
.textStroke {
  -webkit-text-stroke: 0.4px gray;
}
</style>
