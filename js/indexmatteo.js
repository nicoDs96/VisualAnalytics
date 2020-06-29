var selected_diseases = [];

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
        d3.select(this).style("background-color","green");
    }else{
    d3.select(this).style("background-color","white");
    }
}

function handleClickSidebar() {

    if((selected_diseases.length < 5) && !selected_diseases.includes(d3.select(this).text())){
        selected_diseases.push(d3.select(this).text());
    }else if(selected_diseases.includes(d3.select(this).text())){
        selected_diseases.splice(selected_diseases.indexOf(d3.select(this).text()),1);
    }
    else{
        return;
    }
        /*
        --------------------------------------------------------------------
          SELECT A DISEASE AND DRAW THE INTERACTOME OF THE DISEASE'S GENES
        --------------------------------------------------------------------
        */
        let input_array=[];
        selected_diseases.forEach(sel_dis=>{
            let innput_record = disease_gene_mapping.find( record=> record.Diseases === sel_dis)
            if(innput_record!== undefined){
                input_array.push(innput_record);
            }
        });
        draw_from_input(input_array);
        initLegenda();

}

function initLegenda(){
    d3.select("#legenda").selectAll("p").remove();
    selected_diseases.forEach(record =>{
        d3.select("#legenda")
            .append("p").text(record)
            .attr("class","filterelem")
            .on("mouseover", handleMouseOverLegenda)
            .on("mouseout", handleMouseOutLegenda)
            .on("click", handleClickLegenda)
            .append("svg")
            .style("padding-left", "3px")
            .attr("width", 15)
            .attr("height", 15)
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill","red"); //todo:cambiare colore e magari posizionamento a destra

    });
}

function handleMouseOverLegenda() {
    d3.select(this).style("background-color","grey");
}

function handleMouseOutLegenda() {
    d3.select(this).style("background-color","white");
}

function handleClickLegenda() {

}