var i = 0;
var graph = {};
graph.nodes = [];
graph.links = [];

(async () =>{ // main Sync execution loop

    d3.select('body')
        .append('progress')
        .attr("max",141272)
        .attr("value",0);

    await  d3.tsv('datasets/01_Interactome.TSV', (data) =>{
        /*
         * Data Example

         gene_ID_1	gene_ID_2	gene_symbol_1	gene_symbol_2	sources
            1	     310	       A1BG	           ANXA7	    signaling
         *
         * Transforming TSV data into JSON
          graph = {
           nodes: [{id:1,symbol:A1BG},{id:310,symbol:ANXA7}, ...]
           links: [{source:1,target310,value:1}, ...]
          }
         *
         */

        var link = {};
        link.source = data.gene_ID_1;
        link.target = data.gene_ID_2;
        link.value = 1;

        graph.links.push(link); //Append new link

        var node1 = {};
        node1.id = data.gene_ID_1;
        node1.symbol = data.gene_symbol_1;

        var node2 = {};
        node2.id = data.gene_ID_2;
        node2.symbol = data.gene_symbol_2;

        function node1IsPresent(node) {
            return node.id == node1.id;
        }
        function node2IsPresent(node) {
            return node.id == node2.id;
        }

        if ( typeof graph.nodes.find(node1IsPresent) === "undefined" ){
            graph.nodes.push(node1);
        }
        if ( typeof graph.nodes.find(node2IsPresent) === "undefined" ){
            graph.nodes.push(node2);
        }

        d3.select('progress').attr("value", ++i);
    } )

    d3.select('body')
        .append('p')
        .text(JSON.stringify(graph, null, 4));

})();
