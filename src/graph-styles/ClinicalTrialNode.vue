<template>
  <g>
    <g class="clinicalTrial">
      <use
        href="#group"
        :width="layout.height * 0.5"
        :height="layout.height * 0.5"
        class="fill-primary"
        :x="layout.width * 0.5"
        :y="layout.height * 0.3"
      ></use>
      <use
        href="#syringe"
        :width="layout.height * 0.8"
        :height="layout.height * 0.8"
        class="fill-primary"
        x="0"
        :y="layout.height * 0.1"
      ></use>
      <template v-if="zoom >= 0.5">
        <SvgText
          class="stroke-primary text-fill"
          stroke-width="6"
          :content="fullName"
          :x="-layout.width * 0.5"
          y="90"
          :width="layout.width * 2"
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
          :x="-layout.width * 0.5"
          y="90"
          :width="layout.width * 2"
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
  name: "ClinicalTrialNode",
  components: { SvgText },
  computed: {
    fullName() {
      const properties = this.tag.properties;
      return properties.NCTId;
    },
    shortName() {
      const properties = this.tag.properties;
      return properties.NCTId;
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
.clinicalTrial .fill-primary {
  fill: $clinical-trial-color;
}
.clinicalTrial .stroke-primary {
  stroke: $clinical-trial-color;
}
.clinicalTrial .text-fill {
  fill: $primary-text-color;
}
.clinicalTrial .text-fill-small {
  fill: $font-color;
}
</style>
