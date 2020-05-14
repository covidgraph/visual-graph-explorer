<template>
  <g>
    <g class="tissue">
      <use
        href="#tissue-icon"
        :width="layout.width"
        :height="layout.height"
        class="fill-primary"
        x="0"
        y="0"
      ></use>
      <SvgText
        class="stroke-primary text-fill"
        stroke-width="6"
        :content="tag.properties.name"
        :x="-layout.width * 0.5"
        y="35"
        :width="layout.width * 2"
        :height="120"
        :wrapping="4"
        font-family="Roboto,sans-serif"
        :font-size="32"
        :font-style="0"
        :font-weight="0"
        :text-decoration="0"
        :opacity="1"
        visible="true"
        :clipped="true"
        align="middle"
        transform=""
      ></SvgText>
      <SvgText
        class="text-fill"
        :content="tag.properties.name"
        :x="-layout.width * 0.5"
        y="35"
        :width="layout.width * 2"
        :height="120"
        :wrapping="4"
        font-family="Roboto,sans-serif"
        :font-size="32"
        :font-style="0"
        :font-weight="0"
        :text-decoration="0"
        :opacity="1"
        visible="true"
        :clipped="true"
        align="middle"
        transform=""
      ></SvgText>
    </g>
  </g>
</template>

<script>
import SvgText from "./SvgText";

export default {
  name: "TissueNode",
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
.tissue .fill-primary {
  fill: $tissue-color;
}
.tissue .stroke-primary {
  stroke: $tissue-color;
}
.tissue .text-fill {
  fill: $primary-text-color;
}
.tissue .text-fill-small {
  fill: $font-color;
}
</style>
