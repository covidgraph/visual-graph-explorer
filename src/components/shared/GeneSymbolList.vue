<template>
  <v-chip-group>
    <v-chip
      label
      v-for="geneSymbol in geneSymbols"
      :key="getId(geneSymbol)"
      close
      close-icon="mdi-download"
      @click:close="loadGeneSymbol(geneSymbol.identity)"
    >
      <v-avatar left>
        <v-icon color="#BCD104">mdi-dna</v-icon>
      </v-avatar>
      {{ geneSymbol.properties.sid }}
    </v-chip>
  </v-chip-group>
</template>

<script>
import { getId } from "../../util/Neo4jGraphBuilder";

export default {
  name: "GeneSymbolList",
  props: {
    geneSymbols: {
      required: true,
      type: Array,
    },
  },
  methods: {
    getId(item) {
      return getId(item.identity);
    },
    loadGeneSymbol(id) {
      this.eventBus.$emit("load-GeneSymbol", id);
    },
  },
};
</script>

<style scoped></style>
