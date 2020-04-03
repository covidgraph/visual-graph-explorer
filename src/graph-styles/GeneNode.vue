<template>
  <g>
    <g class="gene">
      <use
        class="fill-primary"
        href="#dna-icon"
        :width="layout.height"
        :height="layout.height"
        x="0"
        y="0"
      ></use>
      <template v-if="zoom >= 0.2">
        <SvgText
          class="text-fill"
          :content="tag.properties.sid || 'Gene'"
          x="0"
          :y="layout.height"
          :width="layout.width"
          :height="50"
          :wrapping="0"
          font-family="Roboto,sans-serif"
          :font-size="32"
          :font-style="0"
          :font-weight="1"
          :text-decoration="0"
          :opacity="1"
          visible="true"
          :clipped="false"
          align="middle"
          transform=""
        ></SvgText>
      </template>
    </g>
  </g>
</template>

<script>
import SvgText from "./SvgText";

export default {
  name: "GeneNode",
  components: { SvgText },
  props: {
    tag: {
      type: Object,
      required: true,
    },
    layout: {
      type: Object,
      required: true,
    },
    selected: Boolean,
    zoom: {
      type: Number,
      required: true,
    },
  },
};
</script>

<style lang="scss">
@import "../styles/colors";
.gene .fill-primary {
  fill: $gene-color;
}
.gene .stroke-primary {
  stroke: $gene-color;
}
.gene .text-fill {
  fill: $font-color;
}
</style>
