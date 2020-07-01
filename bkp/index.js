d3.select('body')
    .append('h6')
    .text("HelloD3");
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var width = 600 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

drag = simulation => {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}


(async()=> {
    console.log("Starting drawing graph");

    await d3.json("interactome_small.json", (error, data) => {

        //apply forces to the graph
        var simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                               // This force provides links between nodes
                .id( d => d.id )
                .links(data.links)
            )
            .force("charge", d3.forceManyBody())//.strength(-10))         // This adds repulsion between nodes. -400 is the repulsion strength TODO: user can vary -400 to adjust layout
            .force("x", d3.forceX())
            .force("y", d3.forceY())
        //.force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        //.on("end", ticked);

        //init links
        var link = svg.selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa");

        //init nodes
        var node = svg.selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", 3)
            .style("fill", "#7fdbff")
            .call(drag(simulation));



        // This function is run at each iteration of the force algorithm, updating the nodes position.
        simulation.on("tick", () =>  {
            link
                .attr("x1", function (d) {
                    //return Math.max(0, Math.min(width, d.source.x));
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    //return Math.max(0, Math.min(width, d.source.y));
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    //return Math.max(0, Math.min(width, d.target.x));
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    //return Math.max(0, Math.min(width, d.target.y));
                    return d.target.y;
                });

            node
                .attr("cx", function (d) {
                    //return Math.max(0, Math.min(width, d.x));
                    return d.x ;
                })
                .attr("cy", function (d) {
                    //return Math.max(0, Math.min(width, d.y));
                    return d.y ;
                });
        });
        


    });
})();
