<template>
  <v-card>
    <v-list-item class="header">
      <v-icon x-large color="white">mdi-office-building</v-icon>
      <v-list-item-content>
        <v-list-item-title style="color: white;">
          {{ value.properties.institution }}
        </v-list-item-title>
        <v-list-item-subtitle style="color: #dddddd;">
          {{ value.properties.laboratory }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text outlined rounded color="primary" @click="loadPapers">
        Load Papers
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: "AffiliationPanel",
  props: {
    value: null,
  },
  methods: {
    loadPapers() {
      this.eventBus.$emit("load-papers-for-affiliation", this.value);
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
