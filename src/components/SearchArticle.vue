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
        :items="entries"
        :loading="isLoading"
        :search-input.sync="search"
        hide-details
        full-width
        no-filter
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
        @click="filterResults()"
      >
        <v-icon left small>fas fa-book</v-icon>
        Find Papers
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import query from "../util/dbconnection";
import Vue from "vue";
import { IEnumerable } from "yfiles";
import { getId } from "../util/Neo4jGraphBuilder";

const headers = [
  { text: "Title", value: "title", align: "start", sortable: true },
  { text: "Publication Date", value: "publishTime", sortable: true },
];

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
  },
  methods: {
    filterResults() {
      return new Promise((resolve, reject) => {
        this.eventBus.$emit("show-results-dialog", {
          items: this.entries.map((item) => ({ ID: getId(item.id), ...item })),
          headers,
          resolve,
        });
      }).then((results) => {
        if (results && results.length > 0) {
          this.$emit(
            "search-articles",
            results.map((item) => item.id)
          );
        }
      });
    },
    performSearch() {
      if (this.isLoading) return;
      const search = this.search;
      if (search && this.search.length > 2) {
        this.isLoading = true;
        Promise.all([
          query(
            `MATCH (p:Paper) WHERE toLower(p.title) CONTAINS $word RETURN p LIMIT 10`,
            { word: search.toLowerCase() }
          ),
          query(
            `CALL db.index.fulltext.queryNodes("textOfPapersAndPatents", $query) YIELD node, score
            match (node)<-[:HAS_FRAGMENT]-()<-[:ABSTRACTCOLLECTION_HAS_ABSTRACT|PAPER_HAS_ABSTRACTCOLLECTION*1..2]-(p:Paper) where node:Fragment and not node:AbstractCollection
            WITH p ORDER BY score DESC LIMIT 50 RETURN distinct(p)`,
            { query: search }
          ),
        ])
          // Lazily load input items
          .then(([titleMatches, textMatches]) => {
            const entries = IEnumerable.from(
              [...titleMatches.records, ...textMatches.records].map(
                (record) => {
                  let node = record.get("p");
                  return {
                    id: node.identity,
                    publishTime: node.properties["publish_time"],
                    title: node.properties["title"],
                  };
                }
              )
            )
              .distinct((arg) => getId(arg.id))
              .toArray();
            Vue.set(this, "entries", entries);
            this.count = entries.length;
          })
          .catch((err) => {
            console.log(err);
            this.count = 0;
            this.entries = [];
          })
          .finally(() => {
            if (search !== this.search) {
              setTimeout(() => this.performSearch(), 300);
            }
            this.isLoading = false;
          });
      } else {
        this.count = 0;
        this.entries = [];
      }
    },
  },
  watch: {
    search(val) {
      this.performSearch();
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
