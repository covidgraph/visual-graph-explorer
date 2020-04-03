<template>
  <g>
    <g class="paper">
      <g v-if="zoom >= 0.4">
        <g
          :transform="`translate(100 0) scale(${
            selected && zoom >= 0.5 ? 1 : 0
          } 1)`"
          class="transition-transform"
        >
          <rect
            class="background stroke-primary"
            stroke-width="3"
            width="310"
            :height="layout.height - 3"
            x="1.5"
            y="1.5"
            rx="30"
          ></rect>
          <SvgText
            class="text-primary"
            :content="tag.properties.title"
            x="50"
            y="15"
            :width="400 - 165"
            :height="75"
            :wrapping="4"
            font-family="Roboto,sans-serif"
            :font-size="18"
            :font-style="0"
            :font-weight="0"
            :text-decoration="0"
            :opacity="1"
            visible="true"
            :clipped="true"
            align="start"
            transform=""
          ></SvgText>
          <g transform="translate(50 112)">
            <g>
              <use
                class="text-gray"
                href="#calendar-icon"
                width="20"
                height="20"
              ></use>
              <SvgText
                class="text-gray"
                :content="tag.properties.publish_time || '-'"
                x="25"
                y="0"
                style="text-transform: uppercase;"
                :width="80"
                :height="25"
                :wrapping="0"
                font-family="Roboto,sans-serif"
                :font-size="16"
                :font-style="0"
                :font-weight="0"
                :text-decoration="0"
                :opacity="1"
                visible="true"
                :clipped="true"
                align="start"
                transform=""
              ></SvgText>
            </g>
            <g transform="translate(140 0)">
              <use
                class="text-gray"
                href="#license-icon"
                width="20"
                height="20"
              ></use>
              <SvgText
                class="text-gray"
                :content="tag.properties.license"
                x="25"
                y="0"
                style="text-transform: uppercase;"
                :width="75"
                :height="25"
                :wrapping="0"
                font-family="Roboto,sans-serif"
                :font-size="16"
                :font-style="0"
                :font-weight="0"
                :text-decoration="0"
                :opacity="1"
                visible="true"
                :clipped="true"
                align="start"
                transform=""
              ></SvgText>
            </g>
          </g>
        </g>
        <rect
          class="background"
          x="10"
          y="10"
          :width="layout.height - 40"
          :height="layout.height - 20"
        ></rect>
      </g>
      <use
        class="fill-primary"
        href="#book-icon"
        :width="layout.height"
        :height="layout.height"
        x="0"
        y="0"
      ></use>
      <template v-if="zoom >= 0.5">
        <rect
          class="fill-primary"
          x="20"
          y="10"
          :width="layout.height - 40"
          :height="layout.height - 80"
        ></rect>
        <SvgText
          class="text-white"
          :content="tag.properties.title"
          x="10"
          y="30"
          :width="layout.width - 18"
          :height="50"
          :wrapping="2"
          font-family="Roboto,sans-serif"
          :font-size="16"
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
    </g>
  </g>
</template>

<script>
import SvgText from "./SvgText";

export default {
  name: "PaperNode",
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
.paper .fill-primary {
  fill: $paper-color;
}
.paper .stroke-primary {
  stroke: $paper-color;
}
.paper .background {
  fill: white;
}
.paper .text-white {
  fill: $primary-text-color;
}
.paper .text-gray {
  fill: gray;
}
.paper .text-primary {
  fill: $paper-color;
}

.paper .transition-transform {
  transition: transform 0.3s ease-out;
}
</style>
