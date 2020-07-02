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
        initdegreestat(); //todo: dovrebbe stare nella drawgraph

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
    var drugtransition = d3.transition()
        .duration(2000)
        .ease(d3.easeLinear);
    d3.selectAll(".node-circle").transition(drugtransition)
        .attr("r", 3) //Todo: perchè si ingrandiscono i nodi?
        .attr("stroke","transparent")
        .attr("stroke-width",0);
    if(mydrug === ""){
        console.log("null");
        return;
    }
    let drugrecord = drug_gene_mapping.find( record=> record["Drug Name"] === mydrug);
    var flag = 0;
    drugrecord["Target Entrez Gene IDs"].split(";").forEach(drugid=>{


        var targetnodes = d3.selectAll(".node-circle").filter((d)=>{
            return d.id === drugid
        });
        if(targetnodes.size() > 0){
            flag = 1;
        }

        targetnodes.transition(drugtransition)
            .attr("r", 10)
            .attr("stroke","black")
            .attr("stroke-width",3);
    });

    if(flag == 0){
        d3.select("#drugsmessage").select("text").remove();
        d3.select("#drugsmessage")
            .append("text")
            .style("color","red")
            .text("No genes affected by "+mydrug);
        setTimeout( intervalmessage, 3000);
    }
}

function intervalmessage() {
    d3.select("#drugsmessage").select("text").remove();
}

function initdegreestat(){
    var centrality = new Map();
    var i, first, second, third, fourth, fifth;
    d3.selectAll(".node-circle").each(n=>{
        i=0;
        d3.selectAll(".link").each(l=>{
            if(n.id === l.source.id || n.id === l.target.id){
                i = i+1;
            }
        });
        centrality.set(n.id,i);
    });

    first = [...centrality.entries()].reduce((a, e ) => e[1] > a[1] ? e : a);
    centrality.delete(first[0]);
    second = [...centrality.entries()].reduce((a, e ) => e[1] > a[1] ? e : a);
    centrality.delete(second[0]);
    third = [...centrality.entries()].reduce((a, e ) => e[1] > a[1] ? e : a);
    centrality.delete(third[0]);
    fourth = [...centrality.entries()].reduce((a, e ) => e[1] > a[1] ? e : a);
    centrality.delete(fourth[0]);
    fifth = [...centrality.entries()].reduce((a, e ) => e[1] > a[1] ? e : a);
    centrality.delete(fifth[0]);


    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
        width = 395 - margin.left - margin.right,
        height = 301 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // X axis: scale and draw:
    var x = d3.scaleLinear()
        .domain([0, 1000])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    /*
    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value(function(d) { return d.price; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(70)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(data);

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([height, 0]);
    y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
        .call(d3.axisLeft(y));

    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "#69b3a2")

     */
}




