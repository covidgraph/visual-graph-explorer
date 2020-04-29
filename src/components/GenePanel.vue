<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large class="gene-color--text pb-1">mdi-dna</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text pl-2">
            <div class="wrapText">
              <h4>
                {{ value.properties.sid }}
              </h4>
              <span class="caption">
                {{ value.properties.status }}
                {{ value.properties.taxid }}
              </span>
            </div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-layout class="lime lighten-5">
      <v-col class="flex-row-reverse d-flex pt-0">
        <v-card-actions class="wrap-actions">
          <v-menu>
            <template v-slot:activator="{ on: menu }">
              <v-btn outlined rounded color="primary" light v-on="{ ...menu }"
                >LOAD MORE</v-btn
              >
            </template>
            <v-list>
              <v-list-item @click="loadPapers">
                <v-list-item-title class="primary--text"
                  ><b>PAPERS</b></v-list-item-title
                >
              </v-list-item>
              <v-list-item @click="loadPatents">
                <v-list-item-title class="orange--text"
                  ><b>PATENTS</b></v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
      </v-col>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "GenePanel",
  props: {
    value: null,
  },

  methods: {
    loadPapers() {
      this.eventBus.$emit("load-source-Paper-for-GeneSymbol", this.value);
    },
    loadPatents() {
      this.eventBus.$emit("load-source-Patent-for-GeneSymbol", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.gene-color--text {
  color: $gene-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
