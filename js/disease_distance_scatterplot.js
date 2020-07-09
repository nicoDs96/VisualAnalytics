
/**
 * CALL: draw_scatterplot( mds_classic(get_diseases_distance_matrix(),2)  );
 *
 * */

var margin_sp = {top: 20, bottom: 40, left:40, right:20};
var completeWidth_sp=document.getElementById("dim_red_plot").offsetWidth;
var completeHeight_sp=document.getElementById("dim_red_plot").offsetHeight - 0.2*document.getElementById("dim_red_plot").offsetHeight;
var width_sp = completeWidth_sp - margin_sp.left - margin_sp.right;
var height_sp = completeHeight_sp -margin_sp.top - margin_sp.bottom;

var data_sp ,svg_sp, gx, gy, gDot, gGrid, tooltip_sp;
var k = height / width;
var zx, zy,x,y = null;

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
    zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
    zy = transform.rescaleY(y).interpolate(d3.interpolateRound);
    //const zradius = transform.rescaleY(radius).interpolate(d3.interpolateRound);

    gDot.attr("transform", transform)
        .attr("stroke-width", 5 / transform.k);
    gx.call(xAxis, zx);
    gy.call(yAxis, zy);
    gGrid.call(grid, zx, zy);
}

let brush_control=d3.select("#dim_red_plot").append("div");
brush_control.append("input")
    .attr("type","checkbox")
    .attr("id","show_brush" )
    .attr("name","show_brush" )
    .attr("checked","true")
    .on('change',()=>{document.getElementById("show_brush").checked?d3.select("#brush-rect").style("display","block"):d3.select("#brush-rect").style("display","none")});
brush_control.append("label")
    .attr("for", 'show_brush')
    .text("Brush");

init_brush_sp = ()=>{ //NB MUST BE CALLED AFTER draw_scatterplot function

    const brush = d3.brush()
        .extent([[margin_sp.left, margin_sp.top], [width_sp - margin_sp.right, height_sp - margin_sp.bottom]])
        .on("end", brushed)


    svg_sp.append('g').attr("id","brush-rect").call(brush);

    function brushed() {
        const selection = d3.event.selection;
        if (selection === null) {
            //DESELECT
            svg_sp.selectAll("path").attr("stroke", "rgba(16,3,96,.5)" );

            selected_diseases.forEach(disease=>{
                d3.selectAll(".scatter-disease-path")
                    .filter( el=>el.disease===disease )
                    .attr("stroke", d=> color(d.disease.replace(/[ ]+/g,"-")) );
            });

        } else {
            let [[x0, y0], [x1, y1]] = d3.event.selection; //get the selected area

            console.log(`x0: ${x0},x1: ${x1},y0: ${y0},y1: ${y1}`);//debug line

            let brush_selected = new Set();
            svg_sp.selectAll("path")
                .filter((d) =>{ //get all the point in the selected area
                    if(d!= null){
                        // zx should never be null but to be sure and avoid unpleasant situations we add the conditional
                        // return for safety
                        // we return scaled coordinates if we are zooming or normal if the scatterplot is not zoomed
                        return zx===null? (x(d.x) > x0 && x(d.x) < x1 && y(d.y) > y0 && y(d.y) < y1 ): (zx(d.x) > x0 && zx(d.x) < x1 && zy(d.y) > y0 && zy(d.y) < y1 ) ;
                    }
                    return false;
                })
                .attr("a",d=>{brush_selected.add( d.disease ); return null});

            console.log(brush_selected);
            draw_brush_selection(brush_selected);

        }

    }

}

//UTILITY TO MAKE THE SCALE SLIGHTLY BIGGER
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
        .attr("class","scatter-disease-path")
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

    /*ADD BRUSH*/
    init_brush_sp();
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
        d3.select(d3.event.target).attr("stroke", color(d.disease.replace(/[ ]+/g,"-")) );
    }else if(selected_diseases.includes(d.disease)){
            let removed = selected_diseases.splice(selected_diseases.indexOf(d.disease),1);
            clicked_diseases_legenda.delete(removed[0]);
            d3.select(d3.event.target).attr("stroke", "rgba(16,3,96,.5)" );
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

    draw_from_input(input_array);
    initLegenda();
    display_nodes_labels();
    focus_sidebar_el();
    initdegreestat();

}
focus_sidebar_el = () =>{
    d3.selectAll("p[content]").style("background-color","transparent");
    selected_diseases.forEach(sel_dis=>{
        d3.select(`[content="${sel_dis.replace(/[ ]+/g,"-")}"]`).style("background-color","rgba(51, 170, 51, .3)");
    });
}

draw_brush_selection = (brush_selected) =>{  //.replace(/[ ]+/g,"-")
    let dialog = d3.select("#brush-dialog").attr("hidden","true"); //todo: clear content
    d3.select("#dialog_container").style("display","none");
    brush_selected.forEach(disease=>{ //remove already selected diseases from selection
       if(selected_diseases.includes(disease) ) brush_selected.delete(disease)
    });
    if(brush_selected.size<1){
        console.warn("brush_selected is empty"); //todo: change to log
        return;
    }
    if(brush_selected.size + selected_diseases.length > 5){
        console.log(`brush_selected.size + selected_diseases.length > 5 [total selected:${brush_selected.size + selected_diseases.length}]`);

        d3.select("#dialog_container").style("display","block");
        dialog.attr("hidden",null).style("z-index","1")
            .append("p")
            .text(`Displayed Disease: ${selected_diseases.length}; Max: 5; Brushing has selected ${brush_selected.size}.\n Pick up to ${5- selected_diseases.length} to continue.`);
        let div_cb= dialog.append("div").attr("class","scrollable");

        brush_selected.forEach(disease=>{
            let checkbox_container = div_cb.append("div");
            checkbox_container.append("input")
                .attr("type","checkbox")
                .attr("class","brush-check-box")
                .attr("id",disease.replace(/[ ]+/g,"-") )
                .attr("name",disease.replace(/[ ]+/g,"-") )
                .attr("data",disease );
            checkbox_container.append("label")
                .attr("for",disease.replace(/[ ]+/g,"-") )
                .text(disease);

        });
        dialog.append("div")
            .append("button").attr("type","submit").text("Ok").on("click",handle_brush_manual_selection);


    }else{
        brush_selected.forEach(disease=>{
            selected_diseases.push(disease);

            d3.selectAll(".scatter-disease-path")
                .filter( el=>el.disease===disease )
                .attr("stroke", d=> color(d.disease.replace(/[ ]+/g,"-")) );
        });
        let input_array=[];
        selected_diseases.forEach(sel_dis=>{
            let innput_record = disease_gene_mapping.find( record=> record.Diseases === sel_dis)
            if(innput_record!== undefined){
                input_array.push(innput_record);
            }
        });
        draw_from_input(input_array);
        initLegenda();
        display_nodes_labels();
        focus_sidebar_el();
        initdegreestat();
    }
}

handle_brush_manual_selection = ()=>{
    d3.select("#err_brush").text(``);
    let available_slots = 5 - selected_diseases.length;
    let ckd = new Set();
    let cbs = document.getElementsByClassName('brush-check-box');

    for(let i=0; i<cbs.length; i++){
        if(cbs.item(i).checked) ckd.add(cbs.item(i).getAttribute("data"));
    }
    if(ckd.size > available_slots){
        d3.select("#err_brush").text(`Selected ${ckd.size} instead of ${available_slots}`).style("color","red");
    }else{
        ckd.forEach(disease=>{

            if(! selected_diseases.includes(disease) ) selected_diseases.push(disease);

            d3.selectAll(".scatter-disease-path")
                .filter( el=>el.disease===disease )
                .attr("stroke", d=> color(d.disease.replace(/[ ]+/g,"-")) );
        });
        let input_array=[];
        selected_diseases.forEach(sel_dis=>{
            let innput_record = disease_gene_mapping.find( record=> record.Diseases === sel_dis)
            if(innput_record!== undefined){
                input_array.push(innput_record);
            }
        });
        draw_from_input(input_array);
        initLegenda();
        display_nodes_labels();
        focus_sidebar_el();
        try {
            initdegreestat();
        }catch (e) {
            console.error(e);
        }
        d3.selectAll("#brush-dialog>*").remove();
        d3.select("#dialog_container").style("display","none");
    }

}
