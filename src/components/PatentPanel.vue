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
    <v-expansion-panels multiple accordion flat v-model="expanded">
      <PanelItem
        itemTitle="Other titles"
        :items="
          nonPrimeTitles.map(
            (title) =>
              `${title.text
                .charAt(0)
                .toUpperCase()}${title.text
                .toLowerCase()
                .slice(1)} (${title.lang.toUpperCase()})`
          )
        "
      />
      <PanelItem itemTitle="Date" :items="[value.properties.pub_date]" />
      <PanelItem itemTitle="Patent Owners" :items="owners">
        <template #content>
          <entity-list :entities="owners" />
        </template>
      </PanelItem>
      <PanelItem
        itemTitle="Classification CPC"
        :items="value.properties.classification_cpc"
      />
      <PanelItem
        itemTitle="Classification IPC"
        :items="patent.classification_ipc"
      />
      <PanelItem
        itemTitle="Classification US"
        :items="patent.classification_us"
      />
      <PanelItem itemTitle="Abstract" :items="[abstract]" />
      <v-expansion-panel v-if="geneSymbols.length" class="mr-1" flat>
        <v-expansion-panel-header class="primary--text pb-0">
          <b>Mentioned Genes</b>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="grey lighten-5">
          <gene-symbol-list :geneSymbols="geneSymbols" />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import {
  loadAbstractsForPatent,
  loadGenesForPatent,
  loadTitlesForPatent,
} from "../util/queries";
import PanelItem from "./shared/PanelItem";

import GeneSymbolList from "./shared/GeneSymbolList";
import { loadPatentOwnersForPatent } from "@/util/queries";
import EntityList from "./shared/EntityList";

export default {
  name: "PatentPanel",
  components: {
    EntityList,
    PanelItem,
    GeneSymbolList,
  },
  data: () => ({
    titles: [],
    patent: {},
    geneSymbols: [],
    abstract: "",
    owners: [],
    expanded: [2, 3, 4],
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
          this.patent = { ...patent.properties };

          this.abstract = "Loading...";
          loadPatentOwnersForPatent(patent)
            .then((value) => {
              this.owners = value;
            })
            .catch((reason) => {
              this.owners = ["asdf"];
            });

          loadAbstractsForPatent(patent)
            .then((value) => {
              this.abstract = value.length > 0 ? value[0][0] : "n/a";
            })
            .catch((reason) => {
              this.abstract = "Failed to load " + reason;
            });

          loadGenesForPatent(patent)
            .then((genes) => {
              this.geneSymbols = genes;
            })
            .catch((reason) => {
              this.geneSymbols = [];
            });
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
          this.abstract = "n/a";
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
  white-space: normal !important;
}
</style>
