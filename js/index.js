d3.select('body')
    .append('h1')
    .text("HelloD3");
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var width = 900 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;
var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


(async()=> {
    console.log("Starting drawing graph");

    await d3.json("interactome_small.json", (error, data) => {
        console.log(data)
        //init links
        var link = svg.selectAll("line")
            .data(data.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa");

        console.log("mariaritaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        //init nodes
        var node = svg.selectAll("circle")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("r", 3)
            .style("fill", "#7fdbff");

        //apply forces to the graph
        var simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                               // This force provides links between nodes
                .id(function (d) {
                    return d.id;
                })                     // This provide  the id of a node
                .links(data.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-10))         // This adds repulsion between nodes. -400 is the repulsion strength TODO: user can vary -400 to adjust layout
            .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
            .on("end", ticked);

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) {
                    return Math.max(0, Math.min(width, d.source.x));//d.source.x;
                })
                .attr("y1", function (d) {
                    return Math.max(0, Math.min(width, d.source.y));//d.source.y;
                })
                .attr("x2", function (d) {
                    return Math.max(0, Math.min(width, d.target.x));//d.target.x;
                })
                .attr("y2", function (d) {
                    return Math.max(0, Math.min(width, d.target.y));//d.target.y;
                });

            node
                .attr("cx", function (d) {
                    return Math.max(0, Math.min(width, d.x));//d.x ;
                })
                .attr("cy", function (d) {
                    return Math.max(0, Math.min(width, d.y));//d.y ;
                });
        }

    });
})();
