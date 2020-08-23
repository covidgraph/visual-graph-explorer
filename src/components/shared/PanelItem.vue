<template>
  <v-expansion-panel v-if="items && items.length" class="mr-1" flat>
    <v-expansion-panel-header class="primary--text pb-0">
      <b>{{ itemTitle }}</b>
    </v-expansion-panel-header>
    <v-expansion-panel-content class="grey lighten-5 overflow-content">
      <slot name="content">
        <v-list class="pa-0 ma-0 pt-2">
          <div v-for="(item, i) in items" :key="i">
            <v-list-item class="pa-0 pt-2">
              <v-list-item-content class="pa-0 ma-0">
                <slot v-bind:item="item">
                  <span
                    class="primary--text wrapText subtitle-2 pb-2"
                    v-text="item"
                  />
                </slot>
              </v-list-item-content>
            </v-list-item>
          </div>
        </v-list>
      </slot>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
export default {
  name: "PanelItem",
  props: {
    itemTitle: {
      type: String,
      default: null,
    },
    items: {
      type: Array,
      default: null,
    },
  },
};
</script>

<style scoped>
.overflow-content {
  max-height: 350px !important;
  overflow-y: auto;
}
</style>
