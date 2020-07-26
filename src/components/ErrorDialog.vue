<template>
  <v-dialog v-model="dialog" width="50%">
    <v-card>
      <v-card-title class="headline red lighten-2">
        Oooops! Something went wrong
      </v-card-title>

      <v-card-text>
        {{ error }}
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="dialog = false">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ErrorDialog",
  data: () => ({
    dialog: false,
    error: "",
  }),
  methods: {
    showError(e) {
      this.error = e;
      this.dialog = true;
    },
  },
};
</script>

<style scoped></style>
