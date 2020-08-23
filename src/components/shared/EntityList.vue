<template>
  <v-chip-group column>
    <v-chip
      label
      v-for="entity in entities"
      :key="getId(entity)"
      close
      close-icon="mdi-download"
      @click:close="loadEntitySymbol(entity.identity)"
    >
      <v-avatar left>
        <v-icon color="#050d90">mdi-puzzle</v-icon>
      </v-avatar>
      {{ entity.properties.name }}
    </v-chip>
  </v-chip-group>
</template>

<script>
import { getId } from "../../util/Neo4jGraphBuilder";

export default {
  name: "EntityList",
  props: {
    entities: {
      required: true,
      type: Array,
    },
  },
  methods: {
    getId(item) {
      return getId(item.identity);
    },
    loadEntitySymbol(id) {
      this.eventBus.$emit("load-Entity", id);
    },
  },
};
</script>

<style scoped></style>
