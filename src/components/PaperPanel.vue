<template>
    <v-card>
        <v-list-item>
            <v-icon x-large>mdi-file-document-outline</v-icon>
            <v-list-item-content>
                <v-list-item-title>{{this.value.properties.title}}</v-list-item-title>
                <v-list-item-subtitle>{{this.value.properties.source_x}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <v-list-item>
            <v-list-item-content>
                <v-list-item-title>Published</v-list-item-title>
                <v-list-item-subtitle>{{this.value.properties.publish_time}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <v-list-item>
            <v-list-item-content>
                <v-list-item-title>License</v-list-item-title>
                <v-list-item-subtitle>{{this.value.properties.license}}</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>

        <!--    <v-img
              src="https://cdn.vuetifyjs.com/images/cards/mountain.jpg"
              height="194"
            ></v-img>-->

        <v-card-text>
            {{abstract}}
        </v-card-text>
        <v-card-text>
            This is the fulltext
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
        name: "PaperPanel",
        data: ()=>({
            abstract:""
        }),
        props: {
            value:null
        },
        watch: {
            value:async function(val){
                if (this.value != null){
                    this.abstract = await new Promise((resolve, reject) => {
                        setTimeout(()=> {
                            resolve("abstract text")
                        }, 200)
                    })
                }
            }
        },
    }
</script>

<style scoped>

</style>