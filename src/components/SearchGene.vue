<template>
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
        hide-no-data
        hide-selected
        item-text="Description"
        item-value="Name"
        label="Gene Name"
        placeholder="Start typing to Search"
        prepend-icon="mdi-database-search"
        return-object
      ></v-autocomplete>
    </v-card-text>
    <v-divider></v-divider>
    <v-expand-transition>
      <v-list v-if="model">
        <v-list-item v-for="(field, i) in fields" :key="i">
          <v-list-item-content>
            <v-list-item-title v-text="field.value"></v-list-item-title>
            <v-list-item-subtitle v-text="field.key"></v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-expand-transition>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        :disabled="!model"
        @click="model = null"
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
        @click="$emit('search-gene', model.sid)"
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
    model: null,
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
      return this.entries.map((entry) => {
        const Description =
          entry.Description.length > this.descriptionLimit
            ? entry.Description.slice(0, this.descriptionLimit) + "..."
            : entry.Description;

        return { sid: entry.sid, Description };
      });
    },
  },

  watch: {
    search(val) {
      // Items have already been requested
      if (this.isLoading) return;

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
};
</script>

<style scoped></style>
