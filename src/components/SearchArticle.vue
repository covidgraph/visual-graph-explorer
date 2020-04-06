<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card class="ma-2" outlined>
    <v-card-title class="primary--text pa-2 pb-1 subtitle-1">
      <v-icon class="primary--text white mr-1" size="18">fas fa-book</v-icon>
      Search for <span class="pl-1"><b>Publications</b></span>
    </v-card-title>
    <v-card-text class="pa-2 pt-0">
      Find publications by typing keywords included in titles
    </v-card-text>
    <v-card-text class="ma-0 px-2 py-0">
      <v-autocomplete
        v-model="model"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        hide-details
        full-width
        clearable
        solo
        flat
        outlined
        hide-no-data
        hide-selected
        item-text="title"
        item-value="Name"
        placeholder="Publication title"
        return-object
      >
        <template v-slot:item="data">
          <v-list max-width="280px" three-line dense>
            <v-list-item :title="data.item.title" class="pa-0">
              <v-list-item-avatar size="32">
                <v-icon class="paper-icon" color="white" size="18"
                  >fas fa-book</v-icon
                >
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-subtitle
                  v-html="data.item.title"
                  class="primary--text"
                />
                <v-list-item-subtitle
                  v-html="data.item.publishTime"
                ></v-list-item-subtitle>
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
        @click="$emit('search-article', model.id)"
      >
        <v-icon left small>fas fa-book</v-icon>
        Find Papers
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
          key: "title",
          value: this.model["title"] || "n/a",
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

      if (val.length > 2) {
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
      } else {
        this.count = 0;
        this.entries = [];
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.v-icon.paper-icon {
  color: $dark-icon-color;
  background-color: $paper-color;
}
.paper--background {
  background: $paper-color !important;
}
</style>
