<template>
  <item-panel-base
    :title="properties.name"
    icon="mdi-puzzle"
    icon-class="Protein-color--text pb-1"
  >
    <template #menu>
      <v-list>
        <v-list-item @click="loadPatents">
          <v-list-item-title class="primary--text"
            ><b>PATENTS</b></v-list-item-title
          >
        </v-list-item>
      </v-list>
    </template>
    <v-chip-group column>
      <v-chip
        label
        v-for="entity in properties.filedPatents"
        :key="getId(entity.identity)"
        close
        close-icon="mdi-download"
        @click:close="loadPatent(entity.identity)"
      >
        <v-avatar left>
          <v-icon color="#050d90">fas fa-balance-scale</v-icon>
        </v-avatar>
        {{ entity.properties.lens_url }}
      </v-chip>
    </v-chip-group>
  </item-panel-base>
</template>

<script>
import ItemPanelBase from "@/components/shared/ItemPanelBase";
import PanelItem from "@/components/shared/PanelItem";
import { getId } from "@/util/Neo4jGraphBuilder";

export default {
  components: { ItemPanelBase, PanelItem },
  name: "EntityPanel",
  props: {
    value: Object,
    properties: Object,
  },

  methods: {
    getId: getId,
    loadPatents() {
      this.eventBus.$emit("load-source-Patent-for-Entity", this.value);
    },
    loadPatent(id) {
      this.eventBus.$emit("load-Patent", id);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.Entity-color--text {
  color: $entity-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
