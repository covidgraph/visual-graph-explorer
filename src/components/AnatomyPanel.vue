<template>
  <item-panel-base
    :title="properties.name"
    icon="mdi-brain"
    icon-class="anatomy-color--text"
    hide-menu="true"
  >
    <property-panel
      :schema="{
        'Mesh Name': 'mesh_name',
        'Mesh ID': 'mesh_id',
        'Uberon ID': 'uberon_id',
        'BTO ID': 'bto_id',
      }"
      :value="properties"
    >
    </property-panel>
  </item-panel-base>
</template>
<script>
import ItemPanelBase from "@/components/shared/ItemPanelBase";
import PropertyPanel from "@/components/shared/PropertyPanel";
export default {
  name: "AnatomyPanel",
  components: { PropertyPanel, ItemPanelBase },
  props: {
    value: Object,
    properties: Object,
  },
};
</script>

<style lang="scss">
@import "../styles/colors";
.anatomy-color--text {
  color: $tissue-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
