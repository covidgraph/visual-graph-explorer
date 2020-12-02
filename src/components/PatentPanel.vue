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
        ><a :href="properties.lens_url" target="_blank">{{
          properties.lens_url
        }}</a></v-list-item-subtitle
      >
    </v-list>
    <property-panel
      :schema="{
        Type: 'type',
        Jurisdiction: 'jurisdiction',
        'Publication Date': 'pub_date',
        'Publication Key': 'pub_key',
        'Filing Date': 'filing_date',
        'Filing Key': 'filing_key',
      }"
      :value="properties"
    />
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
      <PanelItem itemTitle="Applicants" :items="properties.patentApplicants">
        <template #content>
          <entity-list :entities="properties.patentApplicants" />
        </template>
      </PanelItem>
      <PanelItem itemTitle="Patent Owners" :items="properties.patentOwners">
        <template #content>
          <entity-list :entities="properties.patentOwners" />
        </template>
      </PanelItem>
      <PanelItem itemTitle="Inventors" :items="properties.patentInventors">
        <template #content>
          <entity-list :entities="properties.patentInventors" />
        </template>
      </PanelItem>
      <PanelItem itemTitle="Abstract" :items="[abstract]" />
      <v-expansion-panel
        v-if="properties.mentionedGeneSymbols.length"
        class="mr-1"
        flat
      >
        <v-expansion-panel-header class="primary--text pb-0">
          <b>Mentioned Genes</b>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="grey lighten-5">
          <gene-symbol-list :geneSymbols="properties.mentionedGeneSymbols" />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import { loadAbstractsForPatent, loadTitlesForPatent } from "../util/queries";
import PanelItem from "./shared/PanelItem";

import GeneSymbolList from "./shared/GeneSymbolList";
import EntityList from "./shared/EntityList";
import PropertyPanel from "@/components/shared/PropertyPanel";

export default {
  name: "PatentPanel",
  components: {
    PropertyPanel,
    EntityList,
    PanelItem,
    GeneSymbolList,
  },
  data: () => ({
    titles: [],
    patent: {},
    abstract: "",
    expanded: [2, 3, 4],
  }),
  props: {
    value: {
      type: Object,
      default: null,
    },
    properties: Object,
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

          loadAbstractsForPatent(patent)
            .then((value) => {
              this.abstract = value.length > 0 ? value[0][0] : "n/a";
            })
            .catch((reason) => {
              this.abstract = "Failed to load " + reason;
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
