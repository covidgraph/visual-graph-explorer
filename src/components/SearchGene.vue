<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card class="ma-2" outlined>
    <v-card-title class="primary--text pa-2 pb-1 subtitle-1">
      <v-icon class="primary--text white mr-1" size="20">mdi-dna</v-icon>
      Search for <span class="pl-1"><b>Genes - Publications</b></span>
    </v-card-title>
    <v-card-text class="pa-2 pt-0">
      Find publications that mention gene names
    </v-card-text>
    <form>
      <v-card-text class="ma-0 px-2 py-0 primary--text">
        <v-autocomplete
          v-model="model"
          :items="items"
          :loading="isLoading"
          :search-input.sync="search"
          hide-details
          full-width
          clearable
          chips
          multiple
          outlined
          hide-no-data
          hide-selected
          item-text="sid"
          placeholder="Gene name"
          return-object
        >
          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs"
              :input-value="data.selected"
              close
              @click="data.select"
              @click:close="remove(data.item)"
            >
              {{ data.item.sid }}
            </v-chip>
          </template>
          <template v-slot:item="data">
            <v-list max-width="280px" dense>
              <v-list-item :title="data.item.name" class="pa-0">
                <v-list-item-avatar
                  color="gene-color--background mr-2"
                  size="32"
                >
                  <v-icon color="primary" size="20">mdi-dna</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title v-html="data.item.sid" />
                  <v-list-item-subtitle
                    v-html="data.item.description"
                    v-if="data.item.sid !== data.item.description"
                  />
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-btn
          class="paper--background white--text"
          text
          rounded
          @click="
            $emit(
              'search-gene',
              model.map((item) => item.sid)
            )
          "
        >
          <v-icon left small>fas fa-book</v-icon>
          Find Papers
        </v-btn>
      </v-card-actions>
    </form>
  </v-card>
</template>
<script>
import query from "../util/dbconnection";

export default {
  name: "SearchGene",
  data: () => ({
    descriptionLimit: 60,
    entries: [],
    isLoading: false,
    model: [],
    search: null,
  }),

  computed: {
    fields() {
      if (!this.model) return [];
      return [
        {
          key: "Name",
          value: this.model["Description"] || "n/a",
        },
      ];
    },
    addedIds() {
      return this.model.map((gene) => gene.sid);
    },
    items() {
      const items = this.entries.map((entry) => {
        const description =
          entry.Description.length > this.descriptionLimit
            ? entry.Description.slice(0, this.descriptionLimit) + "..."
            : entry.Description;

        return { sid: entry.sid, description };
      });

      this.model.forEach((modelItem) => {
        if (items.findIndex((item) => item.sid === modelItem.sid) < 0) {
          items.push(modelItem);
        }
      });
      return items;
    },
  },

  watch: {
    search(val) {
      // Items have already been requested
      if (!val || this.isLoading) return;

      if (val.length > 1) {
        this.isLoading = true;
        // Lazily load input items
        query(
          `MATCH (g:GeneSymbol)
           WHERE toLower(g.sid) 
            STARTS WITH $sid
           AND NOT g.sid in $addedIds
           RETURN g LIMIT 100`,
          { sid: val.toLowerCase(), addedIds: this.addedIds }
        )
          .then((res) => {
            this.count = res.records.length;
            this.entries = res.records.map((record) => {
              let node = record.get("g");
              return {
                id: node.identity,
                sid: node.properties["sid"],
                Description: node.properties["sid"],
              };
            });
          })
          .catch((err) => console.log(err))
          .finally(() => (this.isLoading = false));
      } else {
        this.count = 0;
        this.entries = [];
      }
    },
  },

  methods: {
    remove(item) {
      const index = this.model.findIndex((o) => o.sid === item.sid);
      if (index >= 0) this.model.splice(index, 1);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.gene-color--background {
  background-color: $gene-color !important;
}
.gene-color--text {
  color: $gene-color !important;
}
.paper--background {
  background: $paper-color !important;
}
</style>
