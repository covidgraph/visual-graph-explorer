<template>
  <item-panel-base
    title=""
    icon="mdi-dna"
    icon-class="Protein-color--text pb-1"
  >
    <template #title>
      <v-list-item-title class="primary--text pl-2">
        <div class="wrapText">
          <h4 v-if="value.properties.name">
            {{ value.properties.name }}
          </h4>
          <h4 v-else>
            {{ value.properties.sid }}
          </h4>
        </div>
      </v-list-item-title>
    </template>
    <template #menu>
      <v-list>
        <v-list-item @click="loadGenes">
          <v-list-item-title class="primary--text"
            ><b>GENES</b></v-list-item-title
          >
        </v-list-item>
      </v-list>
    </template>
    <template>
      <PanelItem
        itemTitle="Category"
        v-if="value.properties.category"
        :items="[value.properties.category]"
      />
      <PanelItem
        itemTitle="Description"
        v-if="value.properties.desc"
        :items="[value.properties.desc]"
      />
    </template>
  </item-panel-base>
</template>

<script>
import PanelItem from "./shared/PanelItem";
import ItemPanelBase from "./shared/ItemPanelBase";
export default {
  name: "ProteinPanel",
  components: { PanelItem, ItemPanelBase },
  props: {
    value: null,
  },

  methods: {
    loadGenes() {
      this.eventBus.$emit("load-source-GeneSymbol-for-Protein", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.Protein-color--text {
  color: $protein-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
