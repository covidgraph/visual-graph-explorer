<template>
  <v-card flat>
    <v-list class="lime lighten-5 pt-0 pb-0">
      <v-list-item three-line>
        <v-icon x-large class="tissue-color--text pb-1">mdi-brain</v-icon>
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
  </v-card>
</template>

<script>
export default {
  name: "TissuePanel",
  props: {
    value: null,
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.tissue-color--text {
  color: $tissue-color !important;
}
.wrapText {
  white-space: normal !important;
}
</style>
