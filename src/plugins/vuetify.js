import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#00638f",
        secondary: "#73c2fb",
        accent: "#5b9e2d",
        error: "#dc3545",
        info: "#17a2b8",
        success: "#28a745",
        warning: "#b69329",
      },
    },
  },
});
