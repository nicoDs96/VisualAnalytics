var selected_diseases = [];
var clicked_diseases_legenda = new Set([]);

function init_sidebar(){
    disease_gene_mapping.forEach(record =>{
        d3.select("#filters")
            .append("p").text(record.Diseases)
            .attr("class","filterelem")
            .attr("content",record.Diseases.replace(/[ ]+/g,"-"))
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

        d3.selectAll(".scatter-disease-path")
            .filter( el=>el.disease===d3.select(this).text() )
            .attr("stroke", d=> color(d.disease.replace(/[ ]+/g,"-")) );
    }else if(selected_diseases.includes(d3.select(this).text())){
        let removed = selected_diseases.splice(selected_diseases.indexOf(d3.select(this).text()),1);
        clicked_diseases_legenda.delete(removed[0]);

        d3.selectAll(".scatter-disease-path").filter( el=>el.disease===d3.select(this).text() ).attr("stroke", "rgba(16,3,96,.5)" );
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
        initdegreestat();

}

function initLegenda() {
    d3.select("#legenda")
        .selectAll("p").remove(); //added because exit section introduce a bug in the visualization fo the legend
    let record = d3.select("#legenda")
        .selectAll("p")
        .data(selected_diseases.sort())
    let p = record.enter()
        .append("p")
        .attr("class", "filterelem")
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
        .attr("fill", d => color(d.replace(/[ ]+/g, "-")));
    p.append('span').text(d => {
        return d
    });
    record.exit().remove();

    if (selected_diseases.length > 0){
    let last = d3.select("#legenda").append("p")
        .attr("class", "filterelem");
    last.append("svg")
        .style("padding-left", "3px")
        .attr("width", 15)
        .attr("height", 15)
        .append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "black");
    last.append('span').text("Transit genes");
    }
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
    var numtarget = 0;
    var drugtransition = d3.transition()
        .duration(2000)
        .ease(d3.easeLinear);
    d3.selectAll(".node-circle").transition(drugtransition)
        .attr("r", radius_normal)
        .attr("stroke",null)
        .attr("stroke-width",null);

    if(mydrug === ""){
        console.log("null");
        d3.select("#titledrugs").text("Drug genes: 0");
        return;
    }
    let drugrecord = drug_gene_mapping.find( record=> record["Drug Name"] === mydrug);
    var flag = 0;
    d3.select("#titledrugs").text("Drug genes: "+drugrecord["Number of Targets"]);
    drugrecord["Target Entrez Gene IDs"].split(";").forEach(drugid=>{


        var targetnodes = d3.selectAll(".node-circle").filter((d)=>{
            return d.id === drugid
        });
        if(targetnodes.size() > 0){
            flag = 1;
            numtarget = numtarget + targetnodes.size();
        }

        targetnodes.transition(drugtransition)
            .attr("r", radius_big)
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
    }else{
        d3.select("#drugsmessage").select("text").remove();
        d3.select("#drugsmessage")
            .append("text")
            .style("color","green")
            .text(numtarget+" genes affected by "+mydrug);
        setTimeout( intervalmessage, 3000);
    }
}

function intervalmessage() {
    d3.select("#drugsmessage").select("text").remove();
}

function initdegreestat(){
    d3.select("#barplot").select("svg").remove();
    d3.select("#averagelegenda").remove();
    var centrality = new Map();
    var i, first, second, third, fourth, fifth;
    var average = 0;
    d3.selectAll(".node-circle").each(n=>{
        i=0;
        d3.selectAll(".link").each(l=>{
            if(n.id === l.source.id || n.id === l.target.id){
                i = i+1;
            }
        });
        centrality.set(n.symbol,i);
        average = average + i;
    });

    average = average/centrality.size;
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
    var averageboxes = (first[1]+second[1]+third[1]+fourth[1]+fifth[1])/5;

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 40},
        width = 395 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#barplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, 10])
        .range([ 0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end");

    // Y axis
    var y = d3.scaleBand()
        .range([ 0, height ])
        .domain([first[0],second[0],third[0],fourth[0],fifth[0]])
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y));

    //Bars
    var data = [first,second,third,fourth,fifth];
    svg.selectAll("myRect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", x(0) )
        .attr("y", function(d) { return y(d[0]); })
        .attr("width", "0")
        .attr("height", y.bandwidth() )
        .attr("fill", "#69b3a2")
        .on("mouseover", handleMouseoverBar)
        .on("mouseout", handleMouseoutBar);

    //Average line
    svg.append("line")
        .attr("id","averageline")
        .attr("stroke-width",3)
        .attr("stroke", "red")
        .attr("x1", x(averageboxes))
        .attr("y1", y(0))
        .attr("x2", x(averageboxes))
        .attr("y2", y(0))
        .on("mouseover", handleMouseoverLine)
        .on("mouseout", handleMouseoutLine);

    //Average value
    svg.append("text")
        .text(averageboxes)
        .attr("id","averagevalue")
        .attr("x", x(averageboxes+0.1))
        .attr("y", y(0))
        .attr("font-size",15)
        .attr("opacity",0)
        .style("display","none");

    //Average line global
    svg.append("line")
        .attr("id","averagelineglobal")
        .attr("stroke-width",3)
        .attr("stroke", "black")
        .attr("x1", x(average))
        .attr("y1", y(0))
        .attr("x2", x(average))
        .attr("y2", y(0))
        .on("mouseover", handleMouseoverLineGlobal)
        .on("mouseout", handleMouseoutLineGlobal);

    //Average value global
    svg.append("text")
        .text(average.toFixed(2))
        .attr("id","averagevalueglobal")
        .attr("x", x(average+0.1))
        .attr("y", y(0))
        .attr("font-size",15)
        .attr("opacity",0)
        .style("display","none");

    //Average legenda
    var avleg = d3.select("body").append("p")
        .attr("id","averagelegenda")
        .style("position", "absolute")
        .style("top", "50vh")
        .style("left", "18vw")
        .style("width", "10vw")
        .style("height", "4vh");

        avleg.append("svg")
            .style("padding-left", "3px")
            .attr("width", 15)
            .attr("height", 15)
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill","black")
            .on("mouseover", handleMouseoverLineGlobal)
            .on("mouseout", handleMouseoutLineGlobal);
        avleg.append('span').text("Global average")
            .on("mouseover", handleMouseoverLineGlobal)
            .on("mouseout", handleMouseoutLineGlobal);
        avleg.append("svg")
            .style("padding-left", "3px")
            .attr("width", 15)
            .attr("height", 15)
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill","red")
            .on("mouseover", handleMouseoverLine)
            .on("mouseout", handleMouseoutLine);
        avleg.append('span').text("Top 5 average")
            .on("mouseover", handleMouseoverLine)
            .on("mouseout", handleMouseoutLine);

    // Animation
    svg.selectAll("rect")
        .transition()
        .duration(1000)
        .attr("width", function(d) { return x(d[1]); })
        .delay(function(d,i){ return(i*100)});
    svg.select("#averageline")
        .transition()
        .duration(1000)
        .attr("y2", height+30)
        .delay(600);
    svg.select("#averagevalue")
        .transition()
        .duration(1000)
        .attr("y", height+30)
        .attr("opacity",1)
        .delay(600);
    svg.select("#averagelineglobal")
        .transition()
        .duration(1000)
        .attr("y2", height+30)
        .delay(600);
    svg.select("#averagevalueglobal")
        .transition()
        .duration(1000)
        .attr("y", height+30)
        .attr("opacity",1)
        .delay(600);
}

handleMouseoverBar = (d) => {
    d3.selectAll(".node-circle").filter((n)=>{
        return d[0] === n.symbol;
    }).attr("r",radius_big);
}

handleMouseoutBar = (d) => {
    d3.selectAll(".node-circle").filter((n)=>{
        return d[0] === n.symbol;
    }).attr("r",radius_normal);
}

function handleMouseoverLine(){
    d3.select("#averagevalue").style("display","inline");
}

function handleMouseoutLine(){
    d3.select("#averagevalue").style("display","none");
}

function handleMouseoverLineGlobal(){
    d3.select("#averagevalueglobal").style("display","inline");
}

function handleMouseoutLineGlobal(){
    d3.select("#averagevalueglobal").style("display","none");
}







