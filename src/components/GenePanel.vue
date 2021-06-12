<template>
  <item-panel-base
    :title="properties.sid"
    icon="mdi-dna"
    icon-class="gene-color--text pb-1"
  >
    <template #title>
      <v-list-item-title class="primary--text pl-2">
        <div class="wrapText">
          <h4>
            {{ properties.sid }}
          </h4>
          <span class="caption">
            {{ properties.status }}
            {{ properties.taxid }}
          </span>
        </div>
      </v-list-item-title>
    </template>
    <template #menu>
      <v-list>
        <v-list-item @click="loadPapers">
          <v-list-item-title class="primary--text"
            ><b>PAPERS</b></v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="loadPatents">
          <v-list-item-title class="orange--text"
            ><b>PATENTS</b></v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="loadDiseases">
          <v-list-item-title class="red--text"
            ><b>DISEASES</b></v-list-item-title
          >
        </v-list-item>
      </v-list>
    </template>
    <panel-item item-title="Synonyms" :items="properties.synonyms">
      <template slot="content">
        <gene-list :genes="properties.synonyms" itemTitle="Synonyms">
        </gene-list>
      </template>
    </panel-item>
  </item-panel-base>
</template>

<script>
import { GeneName, isStagingDb } from "../util/dbconnection";
import GeneList from "@/components/shared/GeneSymbolList";
import ItemPanelBase from "@/components/shared/ItemPanelBase";
import PanelItem from "@/components/shared/PanelItem";

export default {
  name: "GenePanel",
  components: { PanelItem, ItemPanelBase, GeneList },
  props: {
    value: Object,
    properties: Object,
  },
  data: () => ({
    isStaging: isStagingDb(),
  }),
  methods: {
    loadPapers() {
      this.eventBus.$emit(`load-source-Paper-for-${GeneName}`, this.value);
    },
    loadPatents() {
      this.eventBus.$emit(`load-source-Patent-for-${GeneName}`, this.value);
    },
    loadDiseases() {
      this.eventBus.$emit(`load-source-Disease-for-${GeneName}`, this.value);
    },
  },
};
</script>

<style lang="scss">
@import "../styles/colors";
.gene-color--text {
  color: $gene-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
