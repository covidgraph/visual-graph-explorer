<template>
  <v-card>
    <v-list-item>
      <v-icon x-large>mdi-file-document-outline</v-icon>
      <v-list-item-content>
        <v-list-item-title>{{
          titles.length > 0 ? titles[0] : "untitled"
        }}</v-list-item-title>
        <v-list-item-subtitle
          ><a :href="value.properties.URL" target="_blank">{{
            value.properties.URL
          }}</a></v-list-item-subtitle
        >
      </v-list-item-content>
    </v-list-item>
    <v-list-item v-for="(text, i) in titles" :key="i">
      <v-list-item-content>
        <v-list-item-subtitle v-text="text"></v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-card-actions>
      <v-btn text color="deep-purple accent-4">
        Read
      </v-btn>
      <v-btn text color="deep-purple accent-4">
        Bookmark
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-share-variant</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { loadTitlesForPatent } from "../util/queries";

export default {
  name: "PatentPanel",
  data: () => ({
    titles: [],
  }),
  props: {
    value: null,
  },
  watch: {
    value: function (patent) {
      this.titles = [];
      if (patent) {
        loadTitlesForPatent(patent)
          .then((value) => {
            this.titles = value;
          })
          .catch((reason) => {
            this.titles = [];
          });
      } else {
        this.titles = [];
      }
    },
  },
};
</script>

<style scoped></style>
