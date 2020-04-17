<template>
  <v-card flat>
    <v-list class="purple lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large color="#d12eae">mdi-account</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text pl-2">
            <div class="wrapText">
              <h4>
                {{ value.properties.first }}
                {{ value.properties.middle }}
                {{ value.properties.last }}
              </h4>
              <span class="caption">
                {{ value.properties.suffix }}
              </span>
            </div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-layout class="purple lighten-5">
      <v-col class="flex-row-reverse d-flex pt-0">
        <v-card-actions class="wrap-actions">
          <v-btn text outlined rounded color="primary" @click="loadPapers">
            Load Papers
          </v-btn>
        </v-card-actions>
      </v-col>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "AuthorPanel",
  props: {
    value: null,
  },
  methods: {
    loadPapers() {
      this.eventBus.$emit("load-papers-for-author", this.value);
    },
  },
};
</script>

<style scoped>
.wrapText {
  white-space: normal !important;
}
</style>
