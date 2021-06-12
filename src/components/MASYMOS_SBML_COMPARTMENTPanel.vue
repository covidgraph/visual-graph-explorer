<template>
  <item-panel-base
    title=""
    icon="mdi-dna"
    icon-class="Protein-color--text pb-1"
  >
    <template #title>
      <v-list-item-title class="primary--text pl-2">
        <div class="wrapText">
          <h4>
            {{ value.properties.NAME || value.properties.ID }}
          </h4>
        </div>
      </v-list-item-title>
    </template>
    <property-panel
      :schema="{ Category: 'category', Description: 'desc', Source: 'source' }"
      :value="properties"
    >
    </property-panel>
    <PanelItem v-if="properties.documents">
      itemTitle="Other Names" :items="properties.documents.map((doc) =>
      doc.properties.URI)" >
    </PanelItem>
  </item-panel-base>
</template>

<script>
import PanelItem from "./shared/PanelItem";
import ItemPanelBase from "./shared/ItemPanelBase";
import PropertyPanel from "@/components/shared/PropertyPanel";
import EntityList from "@/components/shared/EntityList";
export default {
  name: "MASYMOS_SBML_COMPARTMENTPanel",
  components: { PropertyPanel, PanelItem, ItemPanelBase, EntityList },
  props: {
    value: Object,
    properties: Object,
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
