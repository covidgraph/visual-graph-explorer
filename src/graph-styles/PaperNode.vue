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
      <defs>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          id="book-icon"
        >
          <path
            d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          id="calendar-icon"
        >
          <path
            d="M400 64h-48V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v52H160V12c0-6.627-5.373-12-12-12h-40c-6.627 0-12 5.373-12 12v52H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 400H54a6 6 0 0 1-6-6V160h352v298a6 6 0 0 1-6 6zm-52.849-200.65L198.842 404.519c-4.705 4.667-12.303 4.637-16.971-.068l-75.091-75.699c-4.667-4.705-4.637-12.303.068-16.971l22.719-22.536c4.705-4.667 12.303-4.637 16.97.069l44.104 44.461 111.072-110.181c4.705-4.667 12.303-4.637 16.971.068l22.536 22.718c4.667 4.705 4.636 12.303-.069 16.97z"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
          id="license-icon"
        >
          <path
            d="M256 336h-.02c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0C-2.06 328.75.02 320.33.02 336H0c0 44.18 57.31 80 128 80s128-35.82 128-80zM128 176l72 144H56l72-144zm511.98 160c0-16.18 1.34-8.73-85.05-181.51-17.65-35.29-68.19-35.36-85.87 0-87.12 174.26-85.04 165.84-85.04 181.51H384c0 44.18 57.31 80 128 80s128-35.82 128-80h-.02zM440 320l72-144 72 144H440zm88 128H352V153.25c23.51-10.29 41.16-31.48 46.39-57.25H528c8.84 0 16-7.16 16-16V48c0-8.84-7.16-16-16-16H383.64C369.04 12.68 346.09 0 320 0s-49.04 12.68-63.64 32H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h129.61c5.23 25.76 22.87 46.96 46.39 57.25V448H112c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h416c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"
          />
        </svg>
      </defs>
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

<style>
:root {
  --paper-primary-color: #5b9ad9;
  --paper-background: white;
  --paper-text-white: white;
  --paper-text-gray: gray;
}
.paper .fill-primary {
  fill: var(--paper-primary-color);
}
.paper .stroke-primary {
  stroke: var(--paper-primary-color);
}
.paper .background {
  fill: var(--paper-background);
}
.paper .text-white {
  fill: var(--paper-text-white);
}
.paper .text-gray {
  fill: var(--paper-text-gray);
}
.paper .text-primary {
  fill: var(--paper-primary-color);
}

.paper .transition-transform {
  transition: transform 0.3s ease-out;
}
</style>
