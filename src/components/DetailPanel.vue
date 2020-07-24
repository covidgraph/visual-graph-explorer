<template>
  <v-card v-if="nodeIs('Paper')" flat>
    <PaperPanel :value="model"></PaperPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Author')" flat>
    <AuthorPanel :value="model"></AuthorPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Affiliation')" flat>
    <AffiliationPanel :value="model"></AffiliationPanel>
  </v-card>
  <v-card v-else-if="nodeIs('GeneSymbol')" flat>
    <GenePanel :value="model"></GenePanel>
  </v-card>
  <v-card v-else-if="nodeIs('Patent')" flat>
    <PatentPanel :value="model"></PatentPanel>
  </v-card>
  <v-card v-else-if="nodeIs('ClinicalTrial')" flat>
    <ClinicalTrialPanel :value="model"></ClinicalTrialPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Pathway')" flat>
    <PathwayPanel :value="model"></PathwayPanel>
  </v-card>
  <v-card v-else-if="nodeIs('Protein')" flat>
    <ProteinPanel :value="model"></ProteinPanel>
  </v-card>
  <v-card v-else-if="nodeIs('GtexDetailedTissue')" flat>
    <TissuePanel :value="model"></TissuePanel>
  </v-card>
  <v-card v-else-if="nodeIs('Disease')" flat>
    <DiseasePanel :value="model"></DiseasePanel>
  </v-card>
  <v-card v-else-if="nodeIs('Entity')" flat>
    <EntityPanel :value="model"></EntityPanel>
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
import { isOfType } from "../util/Neo4jGraphBuilder";
import ProteinPanel from "./ProteinPanel";
import EntityPanel from "./EntityPanel";
import PathwayPanel from "./PathwayPanel";
import TissuePanel from "./TissuePanel";
import ClinicalTrialPanel from "./ClinicalTrialPanel";
import DiseasePanel from "./DiseasePanel";

export default {
  name: "DetailPanel",
  components: {
    DiseasePanel,
    ClinicalTrialPanel,
    TissuePanel,
    PathwayPanel,
    EntityPanel,
    ProteinPanel,
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
