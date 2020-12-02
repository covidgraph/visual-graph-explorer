<template>
  <item-panel-base
    :title="properties.sid"
    icon="mdi-dna"
    icon-class="transcript-color--text"
    hide-menu="true"
  >
    <property-panel
      :schema="{
        Source: 'source',
        Length: 'length',
        Version: 'version',
        Status: 'status',
        'Tax ID': 'taxid',
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
  name: "TranscriptPanel",
  components: { PropertyPanel, ItemPanelBase },
  props: {
    value: Object,
    properties: Object,
  },
};
</script>

<style lang="scss">
@import "../styles/colors";
.transcript-color--text {
  color: $tissue-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
