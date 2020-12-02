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
    <property-panel
      :schema="{ Category: 'category', Description: 'desc', Source: 'source' }"
      :value="properties"
    >
    </property-panel>
    <PanelItem
      itemTitle="Other Names"
      :items="properties.otherIdentifiers.map((id) => id.properties.sid)"
    >
    </PanelItem>
  </item-panel-base>
</template>

<script>
import PanelItem from "./shared/PanelItem";
import ItemPanelBase from "./shared/ItemPanelBase";
import PropertyPanel from "@/components/shared/PropertyPanel";
import EntityList from "@/components/shared/EntityList";
export default {
  name: "ProteinPanel",
  components: { PropertyPanel, PanelItem, ItemPanelBase, EntityList },
  props: {
    value: Object,
    properties: Object,
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
