<template>
  <v-app>
    <v-navigation-drawer
      app
      left
      clipped
      width="350px"
    >
      <detail-panel ref="detailsPanel">

      </detail-panel>
    </v-navigation-drawer>
    <v-app-bar
      app
      clipped-left
      color="primary"
      dark
    >
      <v-spacer></v-spacer>
      <v-btn
        href="https://covidgraph.github.io"
        target="_blank"
        text
      >
        <span class="mr-2">covidgraph.github.io</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer
      app
      permanent
      right
    >
      <demo-toolbar
        class="toolbar"
        @search-gene="$refs.graphComponent.searchGene($event)"
      ></demo-toolbar>
    </v-navigation-drawer>

    <v-content>
      <v-container
        fluid
        fill-height
      >
        <diagram-component ref="graphComponent" @item-selected="$refs.detailsPanel.show($event)"></diagram-component>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import DiagramComponent from './components/DiagramComponent'
import DemoToolbar from './components/DemoToolbar'
import DetailPanel from './components/DetailPanel'

export default {
  name: 'app',
  components: {
    DemoToolbar,
    DiagramComponent,
    DetailPanel
  }
}
</script>
