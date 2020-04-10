<template>
  <v-card flat>
    <v-list class="orange lighten-5 pt-0" two-lines>
      <v-list-item three-line>
        <v-icon large class="patent-icon pr-2">fas fa-balance-scale</v-icon>
        <v-list-item-content flex-sm-column>
          <v-list-item-title class="primary--text wrapText">
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <h4 v-on="on">
                  {{
                    titles.length > 0
                      ? titles.filter((t) => t.isPrime)[0].text
                      : "untitled"
                  }}
                </h4>
              </template>
              <span>{{
                titles.length > 0
                  ? titles.filter((t) => t.isPrime)[0].text
                  : null
              }}</span>
            </v-tooltip>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item-subtitle class="pa-4 pt-0"
        ><b class="pr-1 primary--text pl-1">URL:</b
        ><a :href="value.properties.lens_url" target="_blank">{{
          value.properties.lens_url
        }}</a></v-list-item-subtitle
      >
    </v-list>
    <v-expansion-panels multiple accordion flat>
      <v-expansion-panel v-if="nonPrimeTitles.length" class="mr-1">
        <v-expansion-panel-header class="primary--text"
          ><b>OTHER TITLES</b></v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <v-list class="pa-0 ma-0">
            <v-list-item
              v-for="(title, i) in nonPrimeTitles"
              :key="i"
              class="pa-0"
            >
              <v-list-item-content class="pa-0 ma-0">
                <v-chip
                  color="primary"
                  label
                  outlined
                  class="wrapText subtitle-2"
                  v-text="
                    `${title.text
                      .charAt(0)
                      .toUpperCase()}${title.text
                      .toLowerCase()
                      .slice(1)} (${title.lang.toUpperCase()})`
                  "
                />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="patent.date" class="mr-1">
        <v-expansion-panel-header class="primary--text"
          ><b>DATE</b></v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <v-list class="pa-0 ma-0">
            <v-list-item class="pa-0">
              <v-list-item-content class="pa-0 ma-0">
                <v-chip
                  color="primary"
                  label
                  outlined
                  class="subtitle-2 wrapText"
                  v-text="patent.date"
                />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="patent.classification_cpc.length" class="mr-1">
        <v-expansion-panel-header class="primary--text"
          ><b>CLASSIFICATION CPC</b></v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <v-list class="pa-0 ma-0">
            <v-list-item
              v-for="(c, i) in patent.classification_cpc"
              :key="i"
              class="pa-0"
            >
              <v-list-item-content class="pa-0 ma-0">
                <v-chip
                  color="primary"
                  label
                  outlined
                  class="wrapText subtitle-2"
                  v-text="c"
                />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="patent.classification_ipc.length" class="mr-1">
        <v-expansion-panel-header class="primary--text"
          ><b>CLASSIFICATION IPC</b></v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <v-list class="pa-0 ma-0">
            <v-list-item
              v-for="(c, i) in patent.classification_ipc"
              :key="i"
              class="pa-0"
            >
              <v-list-item-content class="pa-0 ma-0">
                <v-chip
                  color="primary"
                  label
                  outlined
                  class="wrapText subtitle-2"
                  v-text="c"
                />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="patent.classificaiton_us.length" class="mr-1">
        <v-expansion-panel-header class="primary--text"
          ><b>CLASSIFICATION IPC</b></v-expansion-panel-header
        >
        <v-expansion-panel-content>
          <v-list class="pa-0 ma-0">
            <v-list-item
              v-for="(c, i) in patent.classificaiton_us"
              :key="i"
              class="pa-0 ma-0"
            >
              <v-list-item-content>
                <v-list-item-subtitle
                  class="primary--text wrapText"
                  v-text="c"
                />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import { loadTitlesForPatent } from "../util/queries";
import * as neo4j from "neo4j-driver/lib/browser/neo4j-web";

export default {
  name: "PatentPanel",
  data: () => ({
    titles: [],
    patent: null,
  }),
  props: {
    value: {
      type: Object,
      default: null,
    },
  },
  computed: {
    nonPrimeTitles() {
      return this.titles.filter((title) => !title.isPrime);
    },
  },
  watch: {
    value: {
      immediate: true,
      handler: function (patent) {
        if (patent) {
          this.patent = {
            date: `${neo4j.integer.toNumber(
              patent.properties.pub_date.year
            )}-${neo4j.integer.toNumber(
              patent.properties.pub_date.month
            )}-${neo4j.integer.toNumber(patent.properties.pub_date.day)}`,
            ...patent.properties,
          };
          loadTitlesForPatent(patent)
            .then((nodes) => {
              let titles = nodes.map((node) => ({
                ...node.properties,
                isPrime: false,
              }));
              if (titles.length) {
                let primeIndex = null;
                const localLang = window.navigator.language.slice(0, 2) || "en";
                const indexLocalLang = titles.reduce((m, t, i) => {
                  if (t.lang === localLang) {
                    m.push(i);
                  }
                  return m;
                }, []);
                if (indexLocalLang.length) {
                  primeIndex = indexLocalLang[0];
                } else {
                  const indexEnLang = titles.reduce((m, t, i) => {
                    if (t.lang === "en") {
                      m.push(i);
                    }
                    return m;
                  }, []);
                  if (indexEnLang.length) {
                    primeIndex = indexEnLang[0];
                  } else {
                    primeIndex = 0;
                  }
                }
                titles[primeIndex].isPrime = true;
              }
              this.titles = [...titles];
            })
            .catch((reason) => {
              this.titles = [];
              console.error(reason);
            });
        } else {
          this.titles = [];
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/colors";
.v-icon.patent-icon {
  color: $patent-color;
}
.patent-color--background {
  background-color: $patent-color !important;
}
.wrapText {
  white-space: initial;
}
</style>
