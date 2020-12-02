<template>
  <v-expansion-panels multiple accordion flat v-model="expanded">
    <panel-item
      v-for="entry in entries"
      :key="entry.title"
      v-if="entry.value"
      :itemTitle="entry.title"
      :items="entry.value"
    ></panel-item>
  </v-expansion-panels>
</template>

<script>
import PanelItem from "@/components/shared/PanelItem";

export default {
  components: { PanelItem },
  name: "PropertyPanel",
  data: () => ({ expanded: [] }),
  props: {
    schema: {
      type: Object,
      default: null,
      required: true,
    },
    value: {
      type: Object,
      default: null,
    },
  },
  computed: {
    entries: function () {
      return this.value && this.schema
        ? Object.entries(this.schema).map((entry) => {
            const value = this.value[entry[1]];
            return {
              title: entry[0],
              value:
                typeof value === "undefined" || Array.isArray(value)
                  ? value
                  : [value],
            };
          })
        : [];
    },
  },
};
</script>

<style scoped></style>
