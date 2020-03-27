<template>
  <v-card v-if="nodeIs('Paper')">
    <PaperPanel :value="model"></PaperPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Author')">
    <AuthorPanel :value="model"></AuthorPanel>
  </v-card>
  <v-card v-else-if="nodeIs('GeneSymbol')">
    <GenePanel :value="model"></GenePanel>
  </v-card>
  <v-card v-else>
    <v-card-text>
      Nothing Selected
    </v-card-text>
  </v-card>
</template>

<script>
import PaperPanel from "./PaperPanel";
import AuthorPanel from "./AuthorPanel";
import GenePanel from "./GenePanel";

export default {
  name: "DetailPanel",
  components: {
    PaperPanel,
    AuthorPanel,
    GenePanel,
  },
  data: () => ({
    model: null,
  }),
  methods: {
    nodeIs(label) {
      return (
        this.model && this.model.labels && this.model.labels.indexOf(label) >= 0
      );
    },
    show(value) {
      this.model = value;
    },
  },
};
</script>

<style scoped></style>
