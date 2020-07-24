<template>
  <v-menu
    v-model="open"
    offset-y
    rounded="t-0"
    transition="slide-y-transition"
    z-index="4"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on }">
      <v-row no-gutters align-content="center" align="center">
        <v-col class="pa-sm-1 pa-lg-4" cols="2">
          <v-select
            dark
            v-model="type"
            :items="itemTypes"
            height="32"
            hide-details
            label="Search Type"
            single-line
          ></v-select>
        </v-col>
        <v-col cols="8">
          <v-text-field
            dark
            class="primary"
            v-model="query"
            label="Enter keywords or query"
            single-line
            clearable
            hide-details
            :loading="loading"
            @change="load()"
          >
          </v-text-field>
        </v-col>
        <v-col cols="2">
          <v-btn
            color="primary"
            dark
            v-on="on"
            depressed
            :disabled="loading || !type"
          >
            <v-icon left>mdi-magnify</v-icon>
            Search
          </v-btn>
        </v-col>
      </v-row>
    </template>
    <v-card class="rounded-t-0 d-flex flex-column">
      <v-card-title>
        Search results
        <v-spacer></v-spacer>
        <v-text-field
          v-model="filter"
          append-icon="mdi-filter"
          label="Filter"
          single-line
          clearable
          hide-details
        ></v-text-field>
      </v-card-title>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :search="filter"
        :item-key="'ID'"
        show-select
        :single-select="false"
        class="elevation-1"
      >
      </v-data-table>
      <v-card-actions style="align-items: flex-end; padding: 24px;">
        <v-spacer></v-spacer>
        <v-btn
          rounded
          color="primary"
          :disabled="items.length === 0"
          @click="loadAll()"
          autofocus
          >Load All</v-btn
        >
        <v-btn
          rounded
          color="primary"
          :disabled="selected.length === 0"
          @click="loadSelected()"
          >Load Selected</v-btn
        >
        <v-btn outlined rounded color="primary" @click="cancel()">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { getId } from "../util/Neo4jGraphBuilder";

export default {
  name: "CombinedSearch",
  data: () => ({
    open: false,
    filter: "",
    items: [],
    selected: [],
    headers: [],
    loading: false,
    query: "",
    resolve: null,
    type: null,
    configurations: [],
    currentQuery: "",
  }),
  methods: {
    /**
     *
     * @param {IncrementalGraphLoader} loader
     */
    configure(loader) {
      this.configurations = [];
      loader.queryBuilder.schemaGraph.nodes.forEach((node) => {
        if (node.tag.metadata) {
          this.configurations.push({
            type: node.tag.singularName,
            headers: node.tag.metadata.table.headers,
            query: node.tag.metadata.table.query,
            load(ids) {
              loader.loadNodesForSchema(node, ["id(node) in $ids"], { ids });
            },
          });
        }
      });
      this.type = this.itemTypes[0];
    },
    load() {
      if (this.type && this.query.length > 2 && !this.loading) {
        if (this.query === this.currentQuery) {
          return;
        }
        const configuration = this.configuration;
        if (configuration) {
          this.loading = true;
          this.currentQuery = this.query;
          configuration
            .query(this.currentQuery)
            .then((results) => {
              this.loading = false;
              if (results) {
                if (results.length < 1) {
                  this.eventBus.$emit(
                    "error",
                    "Query did not return any results."
                  );
                } else if (results.length === 1) {
                  configuration.load(results.map((item) => item.id));
                  this.cancel();
                } else {
                  this.headers = configuration.headers;
                  results.forEach((item, index) => {
                    if (!item.ID) {
                      if (item.id) {
                        item.ID = getId(item.id);
                      } else {
                        item.id = index;
                      }
                    }
                  });
                  this.loaded(results, configuration.load);
                }
              } else {
                this.eventBus.$emit(
                  "error",
                  `Query ${this.currentQuery} did not return results.`
                );
              }
            })
            .catch((reason) => {
              this.loading = false;
              this.eventBus.$emit("error", "" + reason);
            });
        }
      }
    },
    loaded(results, loadFunction) {
      this.selected = [];
      this.loadFunction = loadFunction;
      this.items = results;
      this.loading = false;
      this.open = true;
    },
    closeDialog(value) {
      if (this.loadFunction && value && value.length > 0) {
        this.loadFunction(value.map((item) => item.id));
        this.loadFunction = null;
      }
      this.query = "";
      this.open = false;
      this.items = [];
      this.selected = [];
      this.currentQuery = "";
      this.filter = "";
      const resolve = this.resolve;
      this.resolve = null;
      if (resolve) {
        resolve(value);
      }
    },
    loadSelected() {
      this.closeDialog(this.selected);
    },
    loadAll() {
      this.closeDialog(this.items);
    },
    cancel() {
      this.closeDialog(null);
    },
  },
  computed: {
    itemTypes() {
      return this.configurations.map((c) => c.type);
    },
    configuration() {
      return this.configurations.find((c) => c.type === this.type);
    },
  },
  watch: {
    open(val) {
      if (!val) {
        this.cancel();
      }
    },
    query(val) {
      if (val.length === 0) this.open = false;
    },
  },
};
</script>

<style scoped></style>
