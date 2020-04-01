<template>
  <g v-if="visible" :transform="$transform">
    <g v-if="clipped" :transform="'translate(' + x + ' ' + y + ')'">
      <text
        dy="1em"
        :transform="'translate(' + $dx + ' 0)'"
        :text-anchor="$textAnchor"
        :clip-path="'url(#' + refId + ')'"
        :fill="fill"
        :opacity="opacity"
        >{{ content }}</text
      >
      <clipPath :id="refId">
        <rect :width="width" :height="height" :x="-$dx"></rect>
      </clipPath>
    </g>
    <g v-else :transform="'translate(' + x + ' ' + y + ')'">
      <text
        dy="1em"
        :transform="'translate(' + $dx + ' 0)'"
        :text-anchor="$textAnchor"
        :fill="fill"
        :opacity="opacity"
        >{{ content }}</text
      >
    </g>
  </g>
</template>

<script>
import { Font, Size, TextRenderSupport, TextWrapping } from "yfiles";

function updateText(
  value,
  w,
  h,
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  textDecoration,
  lineSpacing,
  wrapping,
  textElement
) {
  while (textElement.firstChild) {
    textElement.removeChild(textElement.firstChild);
  }
  addText(
    value,
    w,
    h,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    textDecoration,
    lineSpacing,
    wrapping,
    textElement
  );
}

function addText(
  value,
  w,
  h,
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  textDecoration,
  lineSpacing,
  wrapping,
  textElement
) {
  if (
    textElement.nodeType !== Node.ELEMENT_NODE ||
    textElement.nodeName !== "text"
  ) {
    return null;
  }

  const text = String(value);
  // create the font which determines the visual text properties
  const fontSettings = {};
  if (typeof fontFamily !== "undefined") {
    fontSettings.fontFamily = fontFamily;
  }
  if (typeof fontSize !== "undefined") {
    fontSettings.fontSize = parseFloat(fontSize);
  }
  if (typeof fontStyle !== "undefined") {
    fontSettings.fontStyle = fontStyle;
  }
  if (typeof fontWeight !== "undefined") {
    fontSettings.fontWeight = fontWeight;
  }
  if (typeof textDecoration !== "undefined") {
    fontSettings.textDecoration = textDecoration;
  }
  if (typeof lineSpacing !== "undefined") {
    fontSettings.lineSpacing = parseFloat(lineSpacing);
  }
  const font = new Font(fontSettings);
  let textWrapping = TextWrapping.CHARACTER_ELLIPSIS;

  // apply the font
  font.applyTo(textElement);

  if (typeof wrapping !== "undefined" && wrapping !== null) {
    switch (wrapping) {
      case TextWrapping.CHARACTER_ELLIPSIS:
      case TextWrapping.CHARACTER:
      case TextWrapping.NONE:
      case TextWrapping.WORD:
      case TextWrapping.WORD_ELLIPSIS:
        textWrapping = wrapping;
        break;
      default:
        // in case of faulty input
        textWrapping = TextWrapping.NONE;
    }
  }

  if (typeof w === "undefined" || w === null) {
    w = Number.POSITIVE_INFINITY;
  }
  if (typeof h === "undefined" || h === null) {
    h = Number.POSITIVE_INFINITY;
  }

  // do the text wrapping
  // This sample uses the strategy CHARACTER_ELLIPSIS. You can use any other setting.
  TextRenderSupport.addText(
    textElement,
    text,
    font,
    new Size(w, h),
    textWrapping
  );

  return textElement;
}

let clipId = 0;

export default {
  name: "SvgText",
  data() {
    return { refId: `svg-text-${clipId++}` };
  },
  mounted() {
    addText(
      this.content,
      this.width,
      this.height,
      this.fontFamily,
      this.fontSize,
      this.fontWeight,
      this.fontStyle,
      this.textDecoration,
      this.lineSpacing,
      this.wrapping,
      this.$el.querySelector("text")
    );
  },
  watch: {
    width() {
      updateText(
        this.content,
        this.width,
        this.height,
        this.fontFamily,
        this.fontSize,
        this.fontWeight,
        this.fontStyle,
        this.textDecoration,
        this.lineSpacing,
        this.wrapping,
        this.$el.querySelector("text")
      );
    },
    height() {
      updateText(
        this.content,
        this.width,
        this.height,
        this.fontFamily,
        this.fontSize,
        this.fontWeight,
        this.fontStyle,
        this.textDecoration,
        this.lineSpacing,
        this.wrapping,
        this.$el.querySelector("text")
      );
    },
    content() {
      updateText(
        this.content,
        this.width,
        this.height,
        this.fontFamily,
        this.fontSize,
        this.fontWeight,
        this.fontStyle,
        this.textDecoration,
        this.lineSpacing,
        this.wrapping,
        this.$el.querySelector("text")
      );
    },
  },

  props: {
    x: {
      required: false,
      default: undefined,
    },
    y: {
      required: false,
      default: undefined,
    },
    width: {
      required: false,
      default: undefined,
    },
    height: {
      required: false,
      default: undefined,
    },
    clipped: {
      required: false,
      default: false,
    },
    align: {
      required: false,
      default: false,
    },
    fill: {
      required: false,
      default: undefined,
    },
    content: {
      required: false,
      default: undefined,
    },
    opacity: {
      default: undefined,
      required: false,
    },
    visible: {
      default: true,
      required: false,
    },
    wrapping: {
      default: TextWrapping.CHARACTER_ELLIPSIS,
      required: false,
    },
    transform: {
      default: "",
      required: false,
    },
    fontFamily: {
      default: undefined,
      required: false,
    },
    fontSize: {
      default: undefined,
      required: false,
    },
    fontWeight: {
      default: undefined,
      required: false,
    },
    fontStyle: {
      default: undefined,
      required: false,
    },
    textDecoration: {
      default: undefined,
      required: false,
    },
    lineSpacing: {
      default: 0.5,
      required: false,
    },
  },
  computed: {
    $dx() {
      return this.align === "end"
        ? this.width
        : this.align === "middle"
        ? this.width * 0.5
        : 0;
    },
    $textAnchor() {
      return this.align === "end" || this.align === "middle"
        ? this.align
        : false;
    },
    $transform() {
      return !this.transform ? false : this.transform;
    },
  },
};
</script>

<style scoped></style>
