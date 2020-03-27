<template>
    <v-card>
        <v-list-item>
            <v-icon x-large>mdi-person</v-icon>
            <v-list-item-content>
                <v-list-item-title>{{this.value.properties.first}} {{this.value.properties.middle}} {{this.value.properties.last}} {{this.value.properties.suffix}}</v-list-item-title>
                <v-list-item-subtitle>{{this.value.properties.email}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <!--    <v-img
              src="https://cdn.vuetifyjs.com/images/cards/mountain.jpg"
              height="194"
            ></v-img>-->

        <v-card-text>
            This is an author
        </v-card-text>

        <v-card-actions>
            <v-btn
                    text
                    color="deep-purple accent-4"
            >
                Load Papers
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
        name: "AuthorPanel",
        props: {
            value:null
        }
    }
</script>

<style scoped>

</style>