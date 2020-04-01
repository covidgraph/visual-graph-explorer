<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card>
    <v-card-title class="headline primary--text">
      Find Genes
    </v-card-title>
    <v-card-text>
      Find publications that mention gene names.
    </v-card-text>
    <v-card-text>
      <v-autocomplete
        v-model="model"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        chips
        multiple
        hide-no-data
        hide-selected
        item-text="sid"
        label="Gene Name"
        placeholder="Start typing to Search"
        prepend-icon="mdi-database-search"
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
          <v-list-item-avatar>
            <v-icon class="dna-icon">mdi-dna</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-html="data.item.sid"></v-list-item-title>
            <v-list-item-subtitle v-html="data.item.description"></v-list-item-subtitle>
          </v-list-item-content>
        </template>

      </v-autocomplete>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        :disabled="!model"
        @click="model = []"
        outlined
        rounded
        small
        color="primary"
      >
        Clear
        <v-icon right small>mdi-close-circle</v-icon>
      </v-btn>
      <v-btn
        :disabled="!model"
        @click="$emit('search-gene', model.map(item => item.sid))"
        outlined
        rounded
        small
        color="primary"
      >
        Load Papers
        <v-icon right small>mdi-cloud-search-outline</v-icon>
      </v-btn>
    </v-card-actions>
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
    items() {
      const items = this.entries.map((entry) => {
        const description =
          entry.Description.length > this.descriptionLimit
            ? entry.Description.slice(0, this.descriptionLimit) + "..."
            : entry.Description;

        return { sid: entry.sid, description };
      });

      this.model.forEach(modelItem => {
          if (items.findIndex(item => item.sid === modelItem.sid) < 0) {
            items.push(modelItem)
          }
        }
      )
      return items;
    },
  },

  watch: {
    search(val) {
      // Items have already been requested
      if (!val || this.isLoading) return;

      this.isLoading = true;

      // Lazily load input items
      query(
        "MATCH (g:GeneSymbol) WHERE toLower(g.sid) STARTS WITH $sid RETURN g LIMIT 100",
        { sid: val.toLowerCase() }
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
        .catch((err) => {
          console.log(err);
        })
        .finally(() => (this.isLoading = false));
    },
  },

  methods: {
    remove (item) {
      const index = this.model.findIndex(o => o.sid === item.sid)
      if (index >= 0) this.model.splice(index, 1)
    },
  }
};
</script>

<style lang="scss" scoped>
  @import "../styles/colors";
  .v-icon.dna-icon {
    color: $dark-icon-color;
    background-color: $gene-color;
  }
</style>
