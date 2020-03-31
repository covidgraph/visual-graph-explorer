<template>
  <v-card>
    <v-list-item>
      <v-icon x-large color="#BCD104">mdi-dna</v-icon>
      <v-list-item-content>
        <v-list-item-title style="color:#BCD104">{{ this.value.properties.sid }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-card-text>
      {{ value.properties.status }}
      {{ value.properties.taxid }}
    </v-card-text>

    <v-container fluid>
      <v-btn text color="#1976d2" @click="loadPapers">
        Load Papers
      </v-btn>
      <v-btn text color="#1976d2" @click="loadPatents">
        Load Patents
      </v-btn>
    </v-container>
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
      this.eventBus.$emit("load-patents-for-gene", this.value)
    }
  },
};
</script>

<style scoped></style>
