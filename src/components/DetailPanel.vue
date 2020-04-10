<template>
  <v-card v-if="nodeIs('Paper')">
    <PaperPanel :value="model"></PaperPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Author')">
    <AuthorPanel :value="model"></AuthorPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Affiliation')">
    <AffiliationPanel :value="model"></AffiliationPanel>
  </v-card>
  <v-card v-else-if="nodeIs('GeneSymbol')">
    <GenePanel :value="model"></GenePanel>
  </v-card>
  <v-card v-else-if="nodeIs('Patent')" flat>
    <PatentPanel :value="model"></PatentPanel>
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
import PatentPanel from "./PatentPanel";
import AffiliationPanel from "./AffiliationPanel";
import { isOfType } from "../util/queries";

export default {
  name: "DetailPanel",
  components: {
    PaperPanel,
    AuthorPanel,
    GenePanel,
    PatentPanel,
    AffiliationPanel,
  },
  data: () => ({
    model: null,
  }),
  methods: {
    nodeIs(label) {
      return isOfType(this.model, label);
    },
    show(value) {
      this.model = value;
    },
  },
};
</script>

<style scoped></style>
