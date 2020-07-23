<template>
  <v-dialog v-model="showDialog" width="80%" height="90%">
    <v-card class="d-flex flex-column" min-height="80vh">
      <v-card-title class="primary white--text" primary-title>
        Load Results
      </v-card-title>
      <v-card-title>
        Find
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
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
        :search="search"
        :item-key="'ID'"
        show-select
        :single-select="false"
        class="elevation-1"
      >
      </v-data-table>
      <v-spacer></v-spacer>
      <v-card-actions style="align-items: flex-end; padding: 24px;"
        ><v-btn
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
        <v-spacer></v-spacer>
        <a href="https://www.yworks.com" target="_blank"
          ><v-img src="../images/yWorks-logo.svg" width="180px"></v-img
        ></a>
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
    search: "",
    selected: [],
    resolve: null,
  }),
  created() {
    this.eventBus.$on("show-results-dialog", ({ items, headers, resolve }) => {
      this.closeDialog(null);
      this.search = "";
      this.selected = [];
      this.items = items;
      this.headers = headers;
      this.showDialog = true;
      this.resolve = resolve;
    });
  },
  methods: {
    closeDialog(value) {
      this.showDialog = false;
      this.items = [];
      this.selected = [];
      this.search = "";
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
