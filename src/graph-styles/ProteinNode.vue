<template>
  <g>
    <g class="protein">
      <use
        href="#protein-icon"
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
          :content="fullName"
          :x="-layout.width * 0.25"
          y="125"
          :width="layout.width * 1.5"
          :height="120"
          :wrapping="1"
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
          :content="fullName"
          :x="-layout.width * 0.25"
          y="125"
          :width="layout.width * 1.5"
          :height="120"
          :wrapping="1"
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
      </template>
      <template v-if="0.2 < zoom && zoom < 0.5">
        <SvgText
          class="text-fill-small"
          :content="shortName"
          x="0"
          y="50"
          :width="layout.width"
          :height="50"
          :wrapping="0"
          font-family="Roboto,sans-serif"
          :font-size="42"
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
  name: "ProteinNode",
  components: { SvgText },
  computed: {
    fullName() {
      const properties = this.tag.properties;
      return [properties.name, properties.sid].filter((n) => n).join("\n");
    },
    shortName() {
      const properties = this.tag.properties;
      return properties.sid;
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
.protein .fill-primary {
  fill: $protein-color;
}
.protein .stroke-primary {
  stroke: $protein-color;
}
.protein .text-fill {
  fill: $primary-text-color;
}
.protein .text-fill-small {
  fill: $font-color;
}
</style>
