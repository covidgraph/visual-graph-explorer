<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large class="Entity-color--text pb-1">mdi-puzzle</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text pl-2">
            <div class="wrapText">
              <h4>
                {{ value.properties.name }}
              </h4>
            </div>
          </v-list-item-title>
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
              <v-list-item @click="loadPatents">
                <v-list-item-title class="primary--text"
                  ><b>PATENTS</b></v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
      </v-col>
    </v-layout>
  </v-card>
</template>

<script>
export default {
  name: "EntityPanel",
  props: {
    value: null,
  },

  methods: {
    loadPatents() {
      this.eventBus.$emit("load-source-Patent-for-Entity", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.Entity-color--text {
  color: $entity-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
