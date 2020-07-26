<template>
  <v-dialog v-model="showDialog" width="80%" height="90%">
    <v-card class="d-flex flex-column" min-height="80vh">
      <v-card-title class="primary white--text" primary-title>
        Load Results
      </v-card-title>
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
        height="inherit"
        v-model="selected"
        :headers="headers"
        :items="items"
        :search="filter"
        :item-key="'id'"
        show-select
        :single-select="false"
        class="elevation-1"
      >
      </v-data-table>
      <v-spacer></v-spacer>
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
  </v-dialog>
</template>

<script>
export default {
  name: "ResultsDialog",
  data: () => ({
    showDialog: false,
    items: [],
    headers: [],
    filter: "",
    selected: [],
    resolve: null,
  }),
  created() {
    this.eventBus.$on("show-results-dialog", ({ items, headers, resolve }) => {
      this.closeDialog(null);
      // not in data on purpose - avoid vue instrumenting the objects.
      this.originalItems = items;
      this.headers = headers;
      this.items = items.map((i, index) => ({ $index: index, ...i }));
      this.showDialog = true;
      this.resolve = resolve;
    });
  },
  methods: {
    closeDialog(value) {
      this.showDialog = false;
      this.items = [];
      this.selected = [];
      this.filter = "";
      const resolve = this.resolve;
      this.resolve = null;
      if (resolve) {
        resolve(value);
      }
    },
    loadSelected() {
      this.closeDialog(this.selected.map((item) => item.$index));
    },
    loadAll() {
      this.closeDialog(this.items.map((item) => item.$index));
    },
    cancel() {
      this.closeDialog(null);
    },
  },
  watch: {
    showDialog: function (val) {
      if (!val) {
        this.cancel();
      }
    },
  },
};
</script>

<style scoped></style>
