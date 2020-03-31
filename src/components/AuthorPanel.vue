<template>
  <v-card>
    <v-list-item style="background-color: #d12eae;">
      <v-icon x-large color="white">mdi-account</v-icon>
      <v-list-item-content>
        <v-list-item-title style="color: white;">
          {{ this.value.properties.first }}
          {{ this.value.properties.middle }}
          {{ this.value.properties.last }}
          {{ this.value.properties.suffix }}
        </v-list-item-title>
        <v-list-item-subtitle style="color: #dddddd;">{{
          this.value.properties.email
        }}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-container fluid>
      <v-btn text color="#1976d2" @click="loadPapers">
        Load Papers
      </v-btn>
    </v-container>

    <v-card-text>
      This is an author
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "AuthorPanel",
  props: {
    value: null,
  },
  methods: {
    loadPapers() {
      this.eventBus.$emit("load-papers-for-author", this.value);
    },
  },
};
</script>

<style scoped></style>
