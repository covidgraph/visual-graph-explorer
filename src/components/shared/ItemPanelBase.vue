<template>
  <v-card flat>
    <v-list class="blue lighten-5 pt-0" two-lines>
      <v-list-item three-line>
        <slot name="icon">
          <v-icon x-large :class="iconClass" :color="iconColor">{{
            icon
          }}</v-icon>
        </slot>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text wrapText">
            <slot name="title">
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <h4 v-on="on">
                    {{ title }}
                  </h4>
                </template>
                <span>{{ title }}</span>
              </v-tooltip>
            </slot>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-layout class="blue lighten-5" v-if="!hideMenu">
      <v-col class="flex-row-reverse d-flex pt-0">
        <v-card-actions class="wrap-actions">
          <v-menu>
            <template v-slot:activator="{ on: menu }">
              <v-btn outlined rounded color="primary" light v-on="{ ...menu }"
                >LOAD MORE</v-btn
              >
            </template>
            <slot name="menu"><span>Hello</span></slot>
          </v-menu>
        </v-card-actions>
      </v-col>
    </v-layout>
    <v-expansion-panels v-model="panel" multiple accordion flat>
      <slot name="default"> </slot>
    </v-expansion-panels>
  </v-card>
</template>

<script>
export default {
  name: "ItemPanelBase",
  data: () => ({
    panel: [0, 1],
  }),
  props: {
    icon: {
      type: String,
      required: false,
      default: "fas fa-book",
    },
    hideMenu: {
      type: Boolean,
      required: false,
      default: false,
    },
    iconColor: {
      type: String,
      required: false,
      default: "#5b9ad9",
    },
    iconClass: {
      type: String,
      required: false,
      default: "pr-2",
    },
    title: String,
  },
};
</script>

<style scoped>
.wrap-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.wrapText {
  white-space: normal !important;
}
</style>
