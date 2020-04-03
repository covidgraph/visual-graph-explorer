<template>
  <g>
    <g class="author">
      <use
        href="#author-icon"
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
          :content="fullName"
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
      <template v-if="0.2 < zoom && zoom < 0.5">
        <SvgText
          class="text-fill"
          :content="shortName"
          x="0"
          y="100"
          :width="layout.width"
          :height="50"
          :wrapping="0"
          font-family="Roboto,sans-serif"
          :font-size="32"
          :font-style="0"
          :font-weight="1"
          :text-decoration="0"
          fill="white"
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
  name: "AuthorNode",
  components: { SvgText },
  computed: {
    fullName() {
      const properties = this.tag.properties;
      return [properties.first, properties.middle, properties.last]
        .filter((n) => n)
        .join(" ");
    },
    shortName() {
      const properties = this.tag.properties;
      return properties.last || properties.first || "Anonymous";
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
.author .fill-primary {
  fill: $author-color;
}
.author .stroke-primary {
  stroke: $author-color;
}
.author .text-fill {
  fill: $primary-text-color;
}
</style>
