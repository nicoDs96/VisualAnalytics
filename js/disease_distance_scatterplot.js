
/**
 * CALL: draw_scatterplot( mds_classic(get_diseases_distance_matrix(),2)  );
 *
 * */

var margin_sp = {top: 20, bottom: 20, left:40, right:20};
var completeWidth_sp=document.getElementById("dim_red_plot").offsetWidth;
var completeHeight_sp=document.getElementById("dim_red_plot").offsetHeight - 0.1*document.getElementById("dim_red_plot").offsetHeight;
var width_sp = completeWidth_sp - margin_sp.left - margin_sp.right;
var height_sp = completeHeight_sp -margin_sp.top - margin_sp.bottom;

var data_sp ,svg_sp, gx, gy, gDot, gGrid;
var k = height / width;


yAxis = (g, y) => g
    .call(d3.axisRight(y).ticks(12 * k))
    .call(g => g.select(".domain").attr("display", "none"))

xAxis = (g, x) => g
    .attr("transform", `translate(0,${height_sp})`)
    .call(d3.axisTop(x).ticks(12))
    .call(g => g.select(".domain").attr("display", "none"))

grid = (g, x, y) => g
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.1)
    .call(g => g
        .selectAll(".x")
        .data(x.ticks(12))
        .join(
            enter => enter.append("line").attr("class", "x").attr("y2", height_sp),
            update => update,
            exit => exit.remove()
        )
        .attr("x1", d => 0.5 + x(d))
        .attr("x2", d => 0.5 + x(d)))
    .call(g => g
        .selectAll(".y")
        .data(y.ticks(12 * k))
        .join(
            enter => enter.append("line").attr("class", "y").attr("x2", width_sp),
            update => update,
            exit => exit.remove()
        )
        .attr("y1", d => 0.5 + y(d))
        .attr("y2", d => 0.5 + y(d)));



function zoomed() {
    const transform = d3.event.transform;
    const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
    const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
    //const zradius = transform.rescaleY(radius).interpolate(d3.interpolateRound);

    gDot.attr("transform", transform)
        .attr("stroke-width", 5 / transform.k);
    gx.call(xAxis, zx);
    gy.call(yAxis, zy);
    gGrid.call(grid, zx, zy);
}

draw_scatterplot = (points) =>{

    data_sp = points.map( (el,idx)=>{
        let d = {};
        d.x = el[0];
        d.y = el[1];
        d.disease = disease_gene_mapping[idx].Diseases.replace(/[ ]+/g,"-");
        return d;
    });
    console.log(data_sp);

    x=d3.scaleLinear()
        .domain(d3.extent(data_sp, d=>{ return d.x;}))
        .range([0.2,width_sp]);

    y=d3.scaleLinear()
        .domain(d3.extent(data_sp, d=>{ return d.y;}))
        .range([height_sp,0.2]);

    radius = d3.scaleLinear().range([0.5,0.1]);

    zoom = d3.zoom()
        .scaleExtent([0.5, 32])
        .on("zoom", zoomed);

    svg_sp = d3.select("#dim_red_plot").append("svg")
        .attr("viewBox", [0, 0, width_sp, height_sp]);

    gGrid = svg_sp.append("g");

    gDot = svg_sp.append("g")
        .attr("fill", "none")
        .attr("stroke-linecap", "round");

    gDot.selectAll("path")
        .data(data_sp)
        .join("path")
        .attr("d", d => `M ${x(d.x)},${y(d.y)} h0`)
        .attr("stroke", "rgba(16,3,96,.5)");

    gx = svg_sp.append("g");

    gy = svg_sp.append("g");

    svg_sp.call(zoom).call(zoom.transform, d3.zoomIdentity);

    svg_sp.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);

}