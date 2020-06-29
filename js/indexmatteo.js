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
    d3.select(this).style("background-color","white");
}

function handleClick() {
<<<<<<< HEAD
=======
    console.log(d3.select(this).text()); //todo: come fare ad avere il testo del p?
>>>>>>> 962bbb44f199cce195cca4ae0084d9ea3a731cd0
    if((selected_diseases.length < 5) && !selected_diseases.includes(d3.select(this).text())){
        selected_diseases.push(d3.select(this).text());
        console.log(selected_diseases);

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
}