<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large class="Protein-color--text pb-1">mdi-dna</v-icon>
        <v-list-item-content flex-sm-column>
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
    <v-expansion-panels>
      <PanelItem
        itemTitle="Category"
        v-if="value.properties.category"
        :items="[value.properties.category]"
      />
      <PanelItem
        itemTitle="Description"
        v-if="value.properties.desc"
        :items="[value.properties.desc]"
      />
    </v-expansion-panels>
  </v-card>
</template>

<script>
import PanelItem from "./shared/PanelItem";
export default {
  name: "ProteinPanel",
  components: { PanelItem },
  props: {
    value: null,
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
