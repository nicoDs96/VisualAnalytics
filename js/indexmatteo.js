var selected_diseases = [];

function init_sidebar(){
    disease_gene_mapping.forEach(record =>{
        d3.select("#filters")
            .append("p").text(record.Diseases)
            .attr("class","filterelem")
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);
    });
}


function handleMouseOver() {
    d3.select(this).style("background-color","grey");
}

function handleMouseOut() {
    if(selected_diseases.includes(d3.select(this).text())){
        d3.select(this).style("background-color","green");
    }else{
    d3.select(this).style("background-color","white");
    }
}

function handleClick() {

    if((selected_diseases.length < 5) && !selected_diseases.includes(d3.select(this).text())){
        selected_diseases.push(d3.select(this).text());
    }else if(selected_diseases.includes(d3.select(this).text())){
        selected_diseases.splice(selected_diseases.indexOf(d3.select(this).text()),1);
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

}