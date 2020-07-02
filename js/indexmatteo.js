var selected_diseases = [];
var clicked_diseases_legenda = new Set([]);

function init_sidebar(){
    disease_gene_mapping.forEach(record =>{
        d3.select("#filters")
            .append("p").text(record.Diseases)
            .attr("class","filterelem")
            .on("mouseover", handleMouseOverSidebar)
            .on("mouseout", handleMouseOutSidebar)
            .on("click", handleClickSidebar);
    });
}


function handleMouseOverSidebar() {
    d3.select(this).style("background-color","grey");
}

function handleMouseOutSidebar() {
    if(selected_diseases.includes(d3.select(this).text())){
        d3.select(this).style("background-color","rgba(51, 170, 51, .3)");
    }else{
    d3.select(this).style("background-color","transparent");
    }
}

function handleClickSidebar() {

    if((selected_diseases.length < 5) && !selected_diseases.includes(d3.select(this).text())){
        selected_diseases.push(d3.select(this).text());
    }else if(selected_diseases.includes(d3.select(this).text())){
        let removed = selected_diseases.splice(selected_diseases.indexOf(d3.select(this).text()),1);
        clicked_diseases_legenda.delete(removed[0]);
    }
    else{
        return;
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

}

function initLegenda(){
    d3.select("#legenda")
        .selectAll("p").remove(); //added because exit section introduce a bug in the visualization fo the legend
    let record = d3.select("#legenda")
        .selectAll("p")
        .data(selected_diseases.sort())
    let p = record.enter()
        .append("p")
        .attr("class","filterelem")
        .on("mouseover", handleMouseOverLegenda)
        .on("mouseout", handleMouseOutLegenda)
        .on("click", handleClickLegenda)
    p.append("svg")
        .style("padding-left", "3px")
        .attr("width", 15)
        .attr("height", 15)
        .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill",d=>color(d.replace(/[ ]+/g,"-")));
    p.append('span').text(d=>{return d});
    record.exit().remove();

}

function handleMouseOverLegenda() {
    d3.select(this).style("background-color","grey");
}

function handleMouseOutLegenda(d) {
    if( clicked_diseases_legenda.has(d) ){
        d3.select(this).style("background-color","rgba(150, 150, 150, .3)");
    }else{
    d3.select(this).style("background-color","transparent");
    }
}

handleClickLegenda = (d,i) => {

    if( clicked_diseases_legenda.has(d) ){
        clicked_diseases_legenda.delete(d)? null :console.error(`error removing ${d} from clicked_diseases_legenda (${clicked_diseases_legenda})`) ;
    }
    else{
        if(d !== null){ //important to ensure a correct behaviour when onmouseout from nodes-circles
            clicked_diseases_legenda.add(d);
        }
    }

    if(clicked_diseases_legenda.size > 0){
        d3.selectAll('.node-circle').style("opacity", 0.3).style("fill", "#aaaaaa");
        d3.selectAll('.node-label').style("opacity", 0.3);
        //highlight relevant nodes and labels
        clicked_diseases_legenda.forEach(disease =>{
            d3.selectAll(`[disease~="${disease.replace(/[ ]+/g,"-")}"]`)
                .style("opacity", 0.7)
                .style("fill", get_color);
        });
    }else{
        d3.selectAll(`.node-circle`).style("opacity", 0.7).style("fill", get_color);
        d3.selectAll(`.node-label`).style("opacity", 0.7).style("fill", get_color);
    }

    display_nodes_labels();

}

function init_drugs_filters(){
        d3.select("#select-state")
                .selectAll("option")
                .data(drug_gene_mapping)
                .enter().append("option")
                .text(function(d) { return d["Drug Name"]; })
                .attr("value", function (d) {
                    return d["Drug Name"];
                });

    $(document).ready(function () {
        $('select').selectize({
            sortField: 'text'
        });
    });
}

function drugsfunction(){
    let mydrug = document.getElementById("select-state").value;
    if(mydrug === ""){
        console.log("null");
        return;
    }
    let drugrecord = drug_gene_mapping.find( record=> record["Drug Name"] === mydrug);
    drugrecord["Target Entrez Gene IDs"].split(";").forEach(drugid=>{
        console.log(drugid);
        var drugtransition = d3.transition()
            .duration(1000)
            .ease(d3.easeLinear);
        d3.selectAll(".nodes-circles").filter((d)=>{
            console.log("dentro la filter");
            console.log(d.id);
            return d.id === drugid
        }).transition(drugtransition)
            .style("r", 8);
    });

}




