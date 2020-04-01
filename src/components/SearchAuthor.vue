<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card>
    <v-card-title class="headline primary--text">
      Search Author
    </v-card-title>
    <v-card-text>
      Find publications by Authors
    </v-card-text>
    <v-card-text>
      <v-autocomplete
        v-model="model"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        hide-no-data
        hide-selected
        item-text="name"
        item-value="Name"
        label="Words in first or last name"
        placeholder="Start typing to Search"
        prepend-icon="mdi-database-search"
        return-object
      >
        <template v-slot:item="data">
          <v-list-item-avatar>
            <v-icon class="author-icon">mdi-account</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-html="data.item.name"></v-list-item-title>
          </v-list-item-content>
        </template>
      </v-autocomplete>
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
    <v-card-actions class="wrap-actions">
      <v-spacer></v-spacer>
      <v-btn
        :disabled="!model"
        @click="model = null"
        outlined
        rounded
        small
        color="primary"
        class="action-button"
      >
        Clear
        <v-icon right small>mdi-close-circle</v-icon>
      </v-btn>
      <v-btn
        :disabled="!model"
        @click="$emit('search-author', model.id)"
        outlined
        rounded
        small
        color="primary"
        class="action-button"
      >
        Load Author
        <v-icon right small>mdi-cloud-search-outline</v-icon>
      </v-btn>
      <v-btn
        :disabled="!model"
        @click="$emit('search-author-papers', model.id)"
        outlined
        rounded
        small
        color="primary"
        class="action-button"
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
  name: "SearchArticle",
  data: () => ({
    descriptionLimit: 60,
    entries: [],
    count: 0,
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
          value: this.model["name"] || "n/a",
        },
      ];
    },
    items() {
      return this.entries;
    },
  },

  watch: {
    search(val) {
      // Items have already been requested
      if (this.isLoading) return;

      this.isLoading = true;

      // Lazily load input items
      query(
        "MATCH (a:Author) WHERE (toLower(a.last) CONTAINS $word) OR (toLower(a.first) CONTAINS $word) RETURN a LIMIT 50",
        { word: val.toLowerCase() }
      )
        .then((res) => {
          this.count = res.records.length;
          this.entries = res.records.map((record) => {
            let node = record.get("a");
            return {
              id: node.identity,
              name: node.properties["first"] + " " + node.properties["last"],
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

<style lang="scss" scoped>
  @import "../styles/colors";
  .wrap-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .action-button {
    margin-top: 5px;
    margin-bottom: 5px;
  }
  .v-icon.author-icon {
    color: $dark-icon-color;
    background-color: $author-color;
  }
</style>
