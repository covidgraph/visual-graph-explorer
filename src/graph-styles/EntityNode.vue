<template>
  <g>
    <g class="entity">
      <use
        href="#entity-icon"
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
          y="30"
          :width="layout.width * 1.5"
          :height="120"
          :wrapping="3"
          font-family="Roboto,sans-serif"
          :font-size="20"
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
          y="30"
          :width="layout.width * 1.5"
          :height="120"
          :wrapping="3"
          font-family="Roboto,sans-serif"
          :font-size="20"
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
          class="text-fill"
          :content="shortName"
          x="0"
          y="30"
          :width="layout.width"
          :height="50"
          :wrapping="2"
          font-family="Roboto,sans-serif"
          :font-size="24"
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
  name: "EntityNode",
  components: { SvgText },
  computed: {
    fullName() {
      const properties = this.tag.properties;
      return properties.name;
    },
    shortName() {
      const properties = this.tag.properties;
      return properties.name;
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
.entity .fill-primary {
  fill: $entity-color;
}
.entity .stroke-primary {
  stroke: $entity-color;
}
.entity .text-fill {
  fill: $primary-text-color;
}
.entity .text-fill-small {
  fill: $font-color;
}
</style>
