<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card>
    <v-card-title class="headline primary--text">
      Find Patent
    </v-card-title>
    <v-card-text>
      Find patents by title
    </v-card-text>
    <v-card-text>
      <v-autocomplete
        v-model="model"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        hide-no-data
        hide-selected
        item-text="Title"
        item-value="Name"
        label="Words in title"
        placeholder="Start typing to Search"
        prepend-icon="mdi-database-search"
        return-object
      >
        <template v-slot:item="data">
          <v-list-item-avatar>
            <v-icon class="patent-icon">mdi-file-document-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-html="data.item.Title"></v-list-item-title>
            <v-list-item-subtitle
              v-html="data.item.PublicationDate"
            ></v-list-item-subtitle>
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
        @click="$emit('search-patent', model.id)"
        outlined
        rounded
        small
        color="primary"
      >
        Load Patent
        <v-icon right small>mdi-cloud-search-outline</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import query from "../util/dbconnection";

export default {
  name: "SearchPatent",
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
      query("MATCh (p:Patent) WHERE p.Title CONTAINS $word RETURN p LIMIT 50", {
        word: val,
      })
        .then((res) => {
          this.count = res.records.length;
          this.entries = res.records.map((record) => {
            let node = record.get("p");
            return {
              id: node.identity,
              PublicationDate: node.properties["PublicationDate"],
              Title: node.properties["Title"],
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
.v-icon.patent-icon {
  color: $dark-icon-color;
  background-color: $patent-color;
}
</style>
