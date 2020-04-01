<template>
  <v-card>
    <v-list-item class="header">
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

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text outlined rounded color="primary" @click="loadPapers">
        Load Papers
      </v-btn>
    </v-card-actions>

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

<style lang="scss" scoped>
@import "../styles/colors";
.header {
  background-color: $author-color;
}
</style>
