<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="26">
          <use href="#group" width="24" height="24" fill="green"></use>
        </svg>
        <v-icon x-large class="ClinicalTrial-color--text pb-1"> </v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text pl-2">
            <div class="wrapText">
              <h4>
                {{ value.properties.NCTId }}
              </h4>
            </div>
          </v-list-item-title>
          <v-list-item-subtitle class="pa-4 pt-0"
            ><b class="pr-1 primary--text pl-1">URL:</b
            ><a :href="value.properties.url" target="_blank">{{
              value.properties.url
            }}</a></v-list-item-subtitle
          >
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-layout class="lime lighten-5">
      <v-col class="flex-row-reverse d-flex pt-0">
        <v-card-actions class="wrap-actions">
          <v-menu>
            <template v-slot:activator="{ on: menu }">
              <v-btn outlined rounded color="primary" light v-on="{ ...menu }"
                >LOAD MORE</v-btn
              >
            </template>
            <v-list>
              <v-list-item @click="loadPapers">
                <v-list-item-title class="primary--text"
                  ><b>PAPERS</b></v-list-item-title
                >
              </v-list-item>
              <v-list-item @click="loadFacilities">
                <v-list-item-title class="primary--text"
                  ><b>CONDUCTING FACILITIES</b></v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
      </v-col>
    </v-layout>
    <v-expansion-panels v-model="panel" multiple accordion flat>
      <PanelItem
        itemTitle="Lead Sponsor"
        :items="[value.properties.leadSponsorName || 'n/a']"
      />
      <PanelItem itemTitle="Status" :items="[value.properties.overallStatus]" />
      <PanelItem
        itemTitle="Collaborator"
        :items="
          Array.isArray(value.properties.collaboratorName)
            ? value.properties.collaboratorName
            : [value.properties.collaboratorName]
        "
      />
    </v-expansion-panels>
  </v-card>
</template>

<script>
import PanelItem from "./shared/PanelItem";

export default {
  name: "ClinicalTrialPanel",
  components: {
    PanelItem,
  },
  props: {
    value: null,
  },
  data: () => ({
    panel: [1, 1, 1],
  }),
  methods: {
    loadPapers() {
      this.eventBus.$emit("load-target-Paper-for-ClinicalTrial", this.value);
    },
    loadFacilities() {
      this.eventBus.$emit("load-target-Facility-for-ClinicalTrial", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.ClinicalTrial-color--text {
  color: $clinical-trial-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
