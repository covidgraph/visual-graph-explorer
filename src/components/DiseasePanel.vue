<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large class="Disease-color--text pb-1">mdi-puzzle</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text pl-2">
            <div class="wrapText">
              <h4>
                {{ value.properties.name }}
              </h4>
              <span class="caption">
                <a :href="value.properties.link" target="_blank">{{
                  value.properties.link
                }}</a>
              </span>
            </div>
            <!-- source , doid, license, -->
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
              <v-list-item @click="loadGenes">
                <v-list-item-title class="primary--text"
                  ><b>GENES</b></v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
      </v-col>
    </v-layout>
    <v-expansion-panels v-model="panel" multiple accordion flat>
      <PanelItem
        itemTitle="Definition"
        v-if="value.properties.definition"
        :items="[value.properties.definition]"
      />
      <PanelItem
        itemTitle="DOID"
        v-if="value.properties.doid"
        :items="[value.properties.doid]"
      />
      <PanelItem
        item-title="License"
        v-if="value.properties.license"
        :items="[value.properties.license]"
      />
    </v-expansion-panels>
  </v-card>
</template>

<script>
import PanelItem from "./shared/PanelItem";

export default {
  components: {
    PanelItem,
  },
  data: () => ({
    panel: [0, 1, 0],
  }),
  name: "DiseasePanel",
  props: {
    value: null,
  },

  methods: {
    loadGenes() {
      this.eventBus.$emit("load-target-GeneSymbol-for-Disease", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.Disease-color--text {
  color: $disease-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
