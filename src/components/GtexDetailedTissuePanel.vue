<template>
  <item-panel-base
    :title="properties.name"
    icon="mdi-brain"
    icon-class="tissue-color--text"
  >
    <property-panel
      :schema="{ 'Mesh ID': 'mesh_id', 'Uberon ID': 'uberon_id' }"
      :value="properties"
    >
    </property-panel>
  </item-panel-base>
</template>

<script>
import ItemPanelBase from "@/components/shared/ItemPanelBase";
import PropertyPanel from "@/components/shared/PropertyPanel";
export default {
  name: "TissuePanel",
  components: { PropertyPanel, ItemPanelBase },
  props: {
    value: Object,
    properties: Object,
  },
};
</script>

<style lang="scss">
@import "../styles/colors";
.tissue-color--text {
  color: $tissue-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
