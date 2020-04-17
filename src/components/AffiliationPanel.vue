<template>
  <v-card flat>
    <v-list class="yellow lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large color="yellow">mdi-office-building</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text wrapText pl-2">
            <div class="wrapText">
              <h4>
                {{ value.properties.institution }}
              </h4>
              <span class="caption">
                {{ value.properties.suffix }}
              </span>
            </div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-layout class="yellow lighten-5">
      <v-col class="flex-row-reverse d-flex pt-0">
        <v-card-actions class="wrap-actions">
          <v-btn text outlined rounded color="primary" @click="loadPapers">
            Load Papers
          </v-btn>
        </v-card-actions>
      </v-col>
    </v-layout>
  </v-card>
  <!-- <v-card>
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
  </v-card> -->
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
<style scoped>
.wrapText {
  white-space: normal !important;
}
</style>
