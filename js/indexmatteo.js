var disease_gene_mapping;
var selected_diseases = [];

d3.tsv('new_data/02__seeds.tsv', (data) =>{
    disease_gene_mapping = data;

    disease_gene_mapping.forEach(record =>{
        d3.select("#filters")
            .append("p").text(record.Diseases)
            .attr("class","filterelem")
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleClick);
    });
});

function handleMouseOver() {
    d3.select(this).style("background-color","grey");
}

function handleMouseOut() {
    d3.select(this).style("background-color","white");
}

function handleClick() {
    if((selected_diseases.length < 5) && !selected_diseases.includes(d3.select(this).text())){
        selected_diseases.push(d3.select(this).text());
        console.log(selected_diseases);
    }
}