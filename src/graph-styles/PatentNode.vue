<template>
  <g>
    <g class="patent">
      <use
        href="#license-icon"
        :width="layout.height"
        :height="layout.height"
        class="fill-primary"
        x="0"
        y="0"
      ></use>
      <template v-if="zoom >= 0.5">
        <SvgText
          class="stroke-primary text-fill"
          stroke-width="6"
          :content="title"
          x="0"
          y="110"
          :width="layout.width"
          :height="25"
          :wrapping="0"
          font-family="Roboto,sans-serif"
          :font-size="20"
          :font-style="0"
          :font-weight="0"
          :text-decoration="0"
          :opacity="1"
          visible="true"
          :clipped="false"
          align="middle"
          transform=""
        ></SvgText>
        <SvgText
          class="text-fill"
          :content="title"
          x="0"
          y="110"
          :width="layout.width"
          :height="25"
          :wrapping="0"
          font-family="Roboto,sans-serif"
          :font-size="20"
          :font-style="0"
          :font-weight="0"
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
  name: "PatentNode",
  components: { SvgText },
  computed: {
    title() {
      return this.tag.properties.title || "";
    },
  },
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
.patent .fill-primary {
  fill: $patent-color;
}
.patent .stroke-primary {
  stroke: $patent-color;
}
.patent .text-fill {
  fill: $primary-text-color;
}
</style>
