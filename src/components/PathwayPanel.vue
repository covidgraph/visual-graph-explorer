<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large class="Pathway-color--text pb-1">mdi-dna</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text pl-2">
            <div class="wrapText">
              <h4 v-if="value.properties.name">
                {{ value.properties.name }}
              </h4>
              <h4 v-else>
                {{ value.properties.sid }}
              </h4>
              <span v-if="value.properties.name">
                {{ value.properties.sid }}
              </span>
            </div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <!--v-layout class="lime lighten-5">
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
    </v-layout-->
    <v-expansion-panels>
      <PanelItem
        itemTitle="Organism"
        v-if="value.properties.org"
        :items="[value.properties.org]"
      />
      <PanelItem
        itemTitle="Description"
        v-if="value.properties.desc"
        :items="[value.properties.desc]"
      />
      <PanelItem
        item-title="Child Pathways"
        v-if="children && children.length > 0"
        :items="children"
        v-slot:default="{ item }"
      >
        <v-chip
          label
          close
          close-icon="mdi-download"
          @click:close="loadChildPathway(item)"
        >
          <v-avatar left>
            <v-icon color="#BCD104">mdi-dna</v-icon>
          </v-avatar>
          {{ item.properties.name }}
        </v-chip>
      </PanelItem>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import PanelItem from "./shared/PanelItem";
import { loadChildPathways } from "../util/queries";
export default {
  name: "PathwayPanel",
  components: { PanelItem },
  props: {
    value: null,
  },
  data: () => ({
    children: [],
  }),
  methods: {
    loadChildPathway(child) {
      this.eventBus.$emit("load-Pathway", child.identity);
    },
    loadGenes() {
      this.eventBus.$emit("load-source-GeneSymbol-for-Pathway", this.value);
    },
  },
  watch: {
    value: {
      immediate: true,
      handler: function (pathway) {
        if (pathway) {
          loadChildPathways(pathway)
            .then((pathways) => {
              this.children = pathways;
            })
            .catch((reason) => {
              this.children = [];
            });
        } else {
          this.children = [];
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.Pathway-color--text {
  color: $pathway-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
