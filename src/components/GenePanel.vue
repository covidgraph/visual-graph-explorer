<template>
  <v-card>
    <v-list-item class="header">
      <v-list-item-title>
        <v-icon x-large color="#555555">mdi-dna</v-icon>
        {{ this.value.properties.sid }}
      </v-list-item-title>
    </v-list-item>
    <v-card-text>
      {{ value.properties.status }}
      {{ value.properties.taxid }}
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text outlined rounded color="primary" @click="loadPapers">
        Load Papers
      </v-btn>
      <v-btn text outlined rounded color="primary" @click="loadPatents">
        Load Patents
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: "GenePanel",
  props: {
    value: null,
  },

  methods: {
    loadPapers() {
      this.eventBus.$emit("load-papers-for-gene", this.value);
    },
    loadPatents() {
      this.eventBus.$emit("load-patents-for-gene", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.header {
  background-color: $gene-color;
  color: $font-color;
}
</style>
