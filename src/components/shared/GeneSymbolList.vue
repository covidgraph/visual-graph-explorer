<template>
  <v-chip-group>
    <v-chip
      label
      v-for="gene in genes"
      :key="getId(gene)"
      close
      close-icon="mdi-download"
      @click:close="loadGene(gene.identity)"
    >
      <v-avatar left>
        <v-icon color="#BCD104">mdi-dna</v-icon>
      </v-avatar>
      {{ gene.properties.sid }}
    </v-chip>
  </v-chip-group>
</template>

<script>
import { getId } from "../../util/Neo4jGraphBuilder";
import { GeneName } from "@/util/dbconnection";

export default {
  name: "GeneList",
  props: {
    genes: {
      required: true,
      type: Array,
    },
  },
  methods: {
    getId(item) {
      return getId(item.identity);
    },
    loadGene(id) {
      this.eventBus.$emit(`load-${GeneName}`, id);
    },
  },
};
</script>

<style scoped></style>
