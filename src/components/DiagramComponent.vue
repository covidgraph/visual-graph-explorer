<template>
    <div class="graph-component-container" ref="GraphComponentElement"></div>
</template>

<script>
    import licenseData from '../../yfiles-license.json'
    import {
        Class,
        GraphBuilder,
        GraphComponent,
        GraphViewerInputMode,
        LayoutExecutor,
        License,
        OrganicLayout,
        ShapeNodeStyle
    } from 'yfiles'
    import DemoToolbar from './DemoToolbar'
    import query from './../util/dbconnection'


    License.value = licenseData

  Class.ensure(LayoutExecutor);

export default {
  name: 'DiagramComponent',
  components: {
    DemoToolbar
  },
  mounted() {
    this.$graphComponent = new GraphComponent(this.$refs.GraphComponentElement)
    let viewerInputMode = new GraphViewerInputMode()
    this.$graphComponent.inputMode = viewerInputMode
    this.$graphComponent.addCurrentItemChangedListener((sender, evt) => {
      if (sender.currentItem && sender.currentItem.tag){
        this.$emit('item-selected', sender.currentItem.tag)
      }
    })
    viewerInputMode.addItemClickedListener((sender, evt) => {
      this.$emit('item-selected', evt.item.tag)
    })
    this.initializeDefaultStyles()
  },
  methods: {

    async searchGene(geneSid){
      const papers = await this.fetchPapersMentioning(geneSid)

      let graphBuilder = new GraphBuilder(this.$graphComponent.graph)
      graphBuilder.nodesSource = papers;
      graphBuilder.nodeLabelBinding = tag => tag.properties["title"]

      graphBuilder.buildGraph()
      await this.$graphComponent.morphLayout(new OrganicLayout())
    },
    async searchArticle(paper_id){
      const papers = (await query("MATCH (p:Paper) WHERE p.paper_id = $id RETURN p LIMIT 1", {id:paper_id})).records.map(record => record.get('p'));;

      let graphBuilder = new GraphBuilder(this.$graphComponent.graph)
      graphBuilder.nodesSource = papers;
      graphBuilder.nodeLabelBinding = tag => tag.properties["title"]

      graphBuilder.buildGraph()
      await this.$graphComponent.morphLayout(new OrganicLayout())
    },
    /**
     * Sets default styles for the graph.
     */
    initializeDefaultStyles() {
      this.$graphComponent.graph.nodeDefaults.style = new ShapeNodeStyle({
        fill: 'orange',
        stroke: 'orange',
        shape: 'rectangle'
      })
    },

    async fetchGenes(geneName){
        return (await this.query('MATCH (g:GeneSymbol) Where g.sid = $symbolName RETURN g LIMIT 10', {symbolName: geneName})).records.map(record => record.get('g'));
    },

    async fetchGenes(geneName){
        return (await this.query('MATCH (g:GeneSymbol) Where g.sid = $symbolName RETURN g LIMIT 10', {symbolName: geneName})).records.map(record => record.get('g'));
    },

    async fetchPapersMentioning(sid){
        return (await query('MATCH (p:Paper)-[r:PAPER_HAS_ABSTRACT]->(ch:CollectionHub)-[aa:ABSTRACT_HAS_ABSTRACT]->(a:Abstract)-[m:MENTIONS]->(g:GeneSymbol) WHERE g.sid = $sid RETURN p as node LIMIT 10', {sid})).records.map(record => record.get('node'));
    },

    /**
     * Creates the default graph.
     */
    async createDefaultGraph() {
      const graph = this.$graphComponent.graph
      graph.clear()

      let runCypherQuery = this.query;

      const genes = await this.fetchPapersMentioning("CP-2")

      let graphBuilder = new GraphBuilder(graph)
      graphBuilder.nodesSource = genes;
      graphBuilder.nodeLabelBinding = "paper_id"

      graphBuilder.buildGraph()

      /*
      let matchClause = '(node:Paper)'
      let whereClauses = []

      // run the query to get the nodes
      const nodeResult = await runCypherQuery(
        `MATCH (node:Paper)
         RETURN DISTINCT node LIMIT 50`
      )
      // extract the nodes from the query result
      const nodes = nodeResult.records.map(record => record.get('node'))
      // obtain an array of all node ids
      const nodeIds = nodes.map(node => node.identity)
      // get all edges between all nodes that we have, omitting self loops and limiting the overall number of
      // results to a multiple of numNodes, as some graphs have nodes wth degrees in the thousands
      const numNodes = nodes.length
      const edgeResult = await runCypherQuery(
        `MATCH (n)-[edge]-(m)
            WHERE id(n) IN $nodeIds
            AND id(m) IN $nodeIds
            AND startNode(edge) <> endNode(edge)
            RETURN DISTINCT edge LIMIT ${numNodes * 5}`,
        { nodeIds }
      )
      // extract the edges from the query result
      const edges = edgeResult.records.map(record => record.get('edge'))

      console.log(nodes)
      console.log(edges)
*/
      this.$graphComponent.fitGraphBounds()
    },
  }
}
</script>

<style scoped>
@import '~yfiles/yfiles.css';
.graph-component-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
