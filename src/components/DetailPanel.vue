<template>
  <v-card>
    <component
      v-if="component"
      v-bind:is="component"
      v-bind:value="model"
      v-bind:properties="properties"
    />
    <v-card-text v-else>
      Nothing Selected
    </v-card-text>
  </v-card>
</template>

<script>
const ctx = require.context("./", false, /Panel$/);

const components = {};
ctx.keys().forEach((k) => {
  const key = k.match(/\.\/(.*Panel)/)[1];
  if (key) {
    components[key] = ctx(k).default;
  }
});

export default {
  name: "DetailPanel",
  components,
  data: () => ({
    model: null,
    properties: null,
  }),
  methods: {
    show(value, properties) {
      this.model = value;
      this.properties = properties;
    },
  },
  computed: {
    component: function () {
      if (this.model) {
        if (this.model.labels && this.model.labels.length > 0) {
          return components[this.model.labels[0] + "Panel"];
        }
      }
      return null;
    },
  },
};
</script>

<style scoped></style>
