<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card class="ma-2" outlined>
    <v-card-title class="primary--text pa-2 pb-1 subtitle-1">
      <v-icon class="primary--text white mr-1" size="20">mdi-account</v-icon>
      Search for <span class="pl-1"><b>Authors - Publications</b></span>
    </v-card-title>
    <v-card-text class="pa-2 pt-0">
      Find authors/publications connections by typing the first or last name of
      the author
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
        item-text="name"
        item-value="Name"
        label="Words in first or last name"
        placeholder="Author name"
        return-object
      >
        <template v-slot:item="data">
          <v-list max-width="280px" dense>
            <v-list-item :title="data.item.name" class="pa-0">
              <v-list-item-avatar size="32">
                <v-icon class="author-icon" color="white" size="20"
                  >mdi-account</v-icon
                >
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-subtitle v-html="data.item.name" />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </template>
      </v-autocomplete>
    </v-card-text>
    <v-card-actions class="pr-4">
      <v-btn
        @click="$emit('search-author', model.id)"
        width="50%"
        class="author--background white--text"
        text
        rounded
      >
        <v-icon left small>mdi-account</v-icon>
        Find Author
      </v-btn>
      <v-btn
        @click="$emit('search-author-papers', model.id)"
        width="50%"
        class="paper--background white--text"
        text
        rounded
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

      if (val && val.length > 2) {
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
.paper--background {
  background: $paper-color !important;
}
.author--background {
  background: $author-color !important;
}
</style>
