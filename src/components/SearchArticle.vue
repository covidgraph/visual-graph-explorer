<template>
  <v-card>
    <v-card-title class="headline">
      Search Article
    </v-card-title>
    <v-card-text>
      Find publications by title
    </v-card-text>
    <v-card-text>
      <v-autocomplete
        v-model="model"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        hide-no-data
        hide-selected
        item-text="title"
        item-value="Name"
        label="Words in title"
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
      <v-btn :disabled="!model" @click="model = null">
        Clear
        <v-icon right>mdi-close-circle</v-icon>
      </v-btn>
      <v-btn :disabled="!model" @click="$emit('search-article', model.id)">
        Load Papers
        <v-icon right>mdi-cloud-search-outline</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import Vuetify from "vuetify";

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
          key: "Title",
          value: this.model["Title"] || "n/a",
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
        "MATCH (p:Paper) WHERE toLower(p.title) CONTAINS $word RETURN p LIMIT 50",
        { word: val.toLowerCase() }
      )
        .then((res) => {
          this.count = res.records.length;
          this.entries = res.records.map((record) => {
            let node = record.get("p");
            return {
              id: node.identity,
              publishTime: node.properties["publish_time"],
              title: node.properties["title"],
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
