
/**
 * CALL: draw_scatterplot( mds_classic(get_diseases_distance_matrix(),2)  );
 *
 * */

var margin_sp = {top: 20, bottom: 20, left:40, right:20};
var completeWidth_sp=document.getElementById("dim_red_plot").offsetWidth;
var completeHeight_sp=document.getElementById("dim_red_plot").offsetHeight - 0.1*document.getElementById("dim_red_plot").offsetHeight;
var width_sp = completeWidth_sp - margin_sp.left - margin_sp.right;
var height_sp = completeHeight_sp -margin_sp.top - margin_sp.bottom;

var data_sp ,svg_sp, gx, gy, gDot, gGrid, tooltip_sp;
var k = height / width;

//DEFINE AXIS OF THE SCATTERPLOT
yAxis = (g, y) => g
    .call(d3.axisRight(y).ticks(12 * k))
    .call(g => g.select(".domain").attr("display", "none"))

xAxis = (g, x) => g
    .attr("transform", `translate(0,${height_sp})`)
    .call(d3.axisTop(x).ticks(12))
    .call(g => g.select(".domain").attr("display", "none"))

//DEFINE GRIDD OF THE SCATTERPLOT
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


//DEFINE BEHAVIOUR ON ZOOM (RESCALE EVERYTHING)
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

//UTILITY TO MAKE THE SCALE SLIGHTLY BIGGER SO THAT POINTS ARE CENTERED
fix_domain_x = (d)=>{
    if (d.x> 0) return d.x+0.2;
    else return d.x-0.2 ;
}
fix_domain_y = (d)=>{
    if (d.y> 0) return d.y+0.2;
    else return d.y-0.2 ;
}
// TAKE THE DATA AND DRAW THEM AS A SCATTER-PLOT + ADD ZOOM TO SVG
draw_scatterplot = (points) =>{

    data_sp = points.map( (el,idx)=>{
        let d = {};
        d.x = el[0];
        d.y = el[1];
        d.disease = disease_gene_mapping[idx].Diseases;
        return d;
    });
    console.log(data_sp);

    x=d3.scaleLinear()
        .domain(d3.extent(data_sp, fix_domain_x))
        .range([5,width_sp-5]);

    y=d3.scaleLinear()
        .domain(d3.extent(data_sp, fix_domain_y))
        //.domain(d3.extent(data_sp, d=>{ return d.y;}))
        .range([height_sp-5,5]);

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
        .attr("stroke", "rgba(16,3,96,.5)")
        .on("mouseover",showtooltip_sp)
        .on("mouseout",d => tooltip_sp.style("display", "none") )
        .on("click",handle_click_disease_path);

    gx = svg_sp.append("g").attr("class","x-axis");

    gy = svg_sp.append("g");

    svg_sp.call(zoom).call(zoom.transform, d3.zoomIdentity);

    svg_sp.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);

    /* ADD TOOLTIP*/
    tooltip_sp = d3.select("body").append("div").call(createTooltip);
}

showtooltip_sp = (d)=>{
    tooltip_sp.style("display", null);
    tooltip_sp.html(`<p>${d.disease}</p>`)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}

handle_click_disease_path = (d) => {

    if( (selected_diseases.length < 5) && !selected_diseases.includes(d.disease) ){
        selected_diseases.push(d.disease);
    }else if(selected_diseases.includes(d.disease)){
            let removed = selected_diseases.splice(selected_diseases.indexOf(d.disease),1);
            clicked_diseases_legenda.delete(removed[0]);
        }
        else{
            return; //for error prevention
        }

    let input_array=[];
    selected_diseases.forEach(sel_dis=>{
        let innput_record = disease_gene_mapping.find( record=> record.Diseases === sel_dis)
        if(innput_record!== undefined){
            input_array.push(innput_record);
        }
    });
    console.log(input_array);
    draw_from_input(input_array);
    initLegenda();
    display_nodes_labels();
    focus_sidebar_el();

}
focus_sidebar_el = () =>{
    d3.select("p[content]").style("background-color","transparent");
    selected_diseases.forEach(sel_dis=>{
        d3.select(`[content="${sel_dis.replace(/[ ]+/g,"-")}"]`).style("background-color","rgba(51, 170, 51, .3)");
    });
}