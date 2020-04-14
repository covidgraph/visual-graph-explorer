<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-card class="ma-2" outlined>
    <v-card-title class="primary--text pa-2 pb-1 subtitle-1">
      <v-icon class="primary--text white mr-1" size="17"
        >fas fa-balance-scale</v-icon
      >
      Search for <span class="pl-1"><b>Patents</b></span>
    </v-card-title>
    <v-card-text class="pa-2 pt-0">
      Find patents by typing keywords included in titles
    </v-card-text>
    <v-card-text class="ma-0 px-2 py-0">
      <v-combobox
        v-model="model"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        no-filter
        hide-details
        full-width
        clearable
        solo
        flat
        outlined
        hide-no-data
        hide-selected
        item-text="Title"
        item-value="id"
        placeholder="Patent name"
        return-object
      >
        <template v-slot:item="data">
          <v-list max-width="280px" two-line dense>
            <v-list-item :title="data.item.Title" class="pa-0">
              <v-list-item-avatar size="32">
                <v-icon class="patent-icon white--text" size="18"
                  >fas fa-balance-scale</v-icon
                >
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title v-html="data.item.Title" />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </template>
      </v-combobox>
    </v-card-text>
    <v-card-actions>
      <v-btn
        class="patent-color--background white--text"
        @click="$emit('search-patent', model.id)"
        text
        rounded
      >
        <v-icon left small>fas fa-balance-scale</v-icon>
        Find Patent
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
    search(val, previousVal) {
      // Items have already been requested
      if (this.isLoading || val === previousVal) return;

      if (val && val.length > 2) {
        this.isLoading = true;
        // Lazily load input items
        query(
          `call db.index.fulltext.queryNodes("patents", $searchtext)
yield node,score match (node)--(p:Patent)-[:HAS_TITLE]->(pt:PatentTitle)
return distinct(id(p)) as id, collect(pt.text) as titles, labels(node)[0] as found_type, node.lang as found_in_lang, score
order by score
desc limit 10`,
          {
            searchtext: val,
          }
        )
          .then((res) => {
            this.entries = res.records.map((record) => ({
              id: record.get("id"),
              Title: record.get("titles")[0],
            }));
          })
          .catch((err) => {
            console.log(err);
          })
          .finally(() => (this.isLoading = false));
      } else {
        this.entries = [];
      }
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
.patent-color--background {
  background-color: $patent-color !important;
}
</style>
