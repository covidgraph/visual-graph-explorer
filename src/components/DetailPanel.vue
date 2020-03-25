<template>
  <v-card v-if="model && model.labels.indexOf('Paper')>= 0">
    <v-list-item>
      <v-icon x-large>mdi-file-document-outline</v-icon>
      <v-list-item-content>
        <v-list-item-title>{{this.model.properties.title}}</v-list-item-title>
        <v-list-item-subtitle>{{this.model.properties.source_x}}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Published</v-list-item-title>
        <v-list-item-subtitle>{{this.model.properties.publish_time}}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <!--    <v-img
          src="https://cdn.vuetifyjs.com/images/cards/mountain.jpg"
          height="194"
        ></v-img>-->

    <v-card-text>
      Here is the abstract
    </v-card-text>

    <v-card-actions>
      <v-btn
        text
        color="deep-purple accent-4"
      >
        Read
      </v-btn>
      <v-btn
        text
        color="deep-purple accent-4"
      >
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
    name: 'DetailPanel',
    data: ()=>({
      model:null,
    }),
    methods:{
      show(value){
        this.model = value;
      }
    }
  }
</script>

<style scoped>

</style>
