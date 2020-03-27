<template>
  <v-card>
    <v-list-item>
      <v-icon x-large>mdi-file-document-outline</v-icon>
      <v-list-item-content>
        <v-list-item-title>{{ this.value.properties.sid }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-card-text>
      {{ value.properties.status }}
      {{ value.properties.taxid }}
    </v-card-text>

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
export default {
  name: "GenePanel",
  props: {
    value: null,
  },
};
</script>

<style scoped></style>
