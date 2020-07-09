
/*
Array [ Object { Diseases: "adrenal gland diseases",
                    Genes: "3758,215,3762,1589,1585,6770,2516,6557,5573,2778,7809,1584,1586,51,1187,190,3284,7157"
               }
       ... ]
* */
var disease_gene_mapping = [];

/*
Array [ Object { "Drug Name": "Abarelix",
                "Number of Targets": "1",
                "Traget Gene Names": "GNRHR",
                "Target Entrez Gene IDs": "2798"
                }
       ... ]
* */
var drug_gene_mapping = [];

/*
Array [ Object { gene_ID_1: "1",
                 gene_ID_2: "6622",
                 gene_symbol_1: "A1BG",
                 gene_symbol_2: "SNCA",
                 sources: "signaling" }
       ... ]
*/
var interactome= [];

var useful_genes_list = new Set([]);

var t0,t1, show_labels,tooltip, new_interactome;
var font_size_normal = '70%';
var font_size_big = '80%';
var radius_normal = 5;
var radius_big = 9;
/*
    VIEW SETUP
* */
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var width = 650 - margin.left - margin.right;
var height = 650 - margin.top - margin.bottom;

var svg = d3.select("#network").append("svg")
    .attr("id", "canvas")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", [-width / 2, -height / 2, width, height]);
svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr('id','nodes-group');
svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr('id','links-group');

//Set up the colour scale
var color = d3.scaleOrdinal(d3.schemeCategory10);

//init the environment
(init_env = async  ()=>{

    /*
    * READ ALL DATA
    * */

    //load disease-gene mapping
    t0 = performance.now();
    await d3.tsv('new_data/02__seeds.tsv', (record) =>{
        disease_gene_mapping.push(record);
        //if gene is not in  useful_genes_list add it to the list
        record.Genes.split(",").forEach(gene=>{
            useful_genes_list.add(parseInt(gene));
        });
    });
    t1 = performance.now();
    console.log(`Read and process of 02__seeds.tsv took ${t1 - t0} milliseconds.`);

    //load drug-gene mapping
    t0 = performance.now();
    await d3.tsv('new_data/03_Drug-target.tsv', (record) =>{
        drug_gene_mapping.push(record);
        //if gene is not in  useful_genes_list add it to the list
        record["Target Entrez Gene IDs"].split(";").forEach(gene=>{
            useful_genes_list.add(parseInt(gene));
        });
    });

    t1 = performance.now();
    console.log(`Read and process of 03_Drug-target.tsv took ${t1 - t0} milliseconds.`);

    //load interactome
    t0 = performance.now();
    await  d3.tsv('new_data/01_Interactome.TSV', (record) =>{
        interactome.push(record);
    });
    /*
       FILTER THE INTERACTOME MAINTAINING ONLY USEFUL RECORDS
     * */
    new_interactome = [];
    interactome.forEach(record =>{
        if(useful_genes_list.has(parseInt(record.gene_ID_1)) || useful_genes_list.has(parseInt(record.gene_ID_2)) ){
            new_interactome.push(record);
        }
    });
    console.log(`new_interactome size: ${new_interactome.length}\ninteractome size: ${interactome.length}\nSize reduced of ${(100 - new_interactome.length*100/interactome.length).toFixed(2)}\%`);

    t1 = performance.now();
    console.log(`Read and process of 01_Interactome.TSV took ${t1 - t0} milliseconds.`);

    //Init sidebar
    init_sidebar();
    //Init drugs filters
    init_drugs_filters();

    clean_scene(); //clean-init svg container
    //insert checkbox to show_labels
    let lbl =  d3.select("#controls").append("label")
    lbl.text("Show Genes Symbol");
    lbl.append("input")
    .attr("type","checkbox")
    .attr("id","show_labels")
    .attr("checked",null)
    .on('change', display_nodes_labels);
    //init tooltip
    tooltip = d3.select("body").append("div").call(createTooltip);

    await draw_scatterplot( mds_classic(get_diseases_distance_matrix(),2)  );

})();

display_nodes_labels = () =>{
    if(document.getElementById("show_labels").checked){
        d3.selectAll(".node-label").style("display","block").style("font-size",font_size_normal);
        //check for selected diseases from legenda
        if( clicked_diseases_legenda.size > 0){ // show labels only for selected elements making text bigger
            d3.selectAll(".node-label").style("display","none");

            clicked_diseases_legenda.forEach(disease =>{
                d3.selectAll(`.node-label[disease~="${disease.replace(/[ ]+/g,"-")}"]`)
                    .style("display","block")
                    .style("font-size",font_size_big);
            });

        }
    }else{
        d3.selectAll(".node-label").style("display","none").style("font-size",font_size_normal);

    }
};

/**
 * Draws the interactome filtered by genes from a given disease
 * @param {[]} input_array: the vector containing the selected record from disease_gene_mapping
 */
function draw_from_input(input_array){

    let full_graph = {};
    full_graph.nodes = [];
    full_graph.links = [];

    clean_scene();

    for(let i = 0; i < input_array.length; i++ ){
        var disease = input_array[i].Diseases;
        var disease_genes = new Set( input_array[i].Genes.split(",") );

        let filtered_interactome_graph = filter_interactome_graph(disease_genes);
        filtered_interactome_graph.disease = disease
        filtered_interactome_graph.nodes =  filtered_interactome_graph.nodes.map( node =>{
            node.disease = disease.replace(/[ ]+/g,"-");
            return node;
        } )

        full_graph.nodes = full_graph.nodes.concat(filtered_interactome_graph.nodes)
        full_graph.links = full_graph.links.concat(filtered_interactome_graph.links)
    }
    draw_graph(clean_graph(full_graph));

}

/**
 * @param {Set<any>} gene_set: list of genes IDs
 * @return {Graph} graph: an object containing nodes and links properties representing the filtered interactome i.e the
 *         interactome containing only the genes in the gene_set
 *
 */
function filter_interactome_graph(gene_set) {

    if(new_interactome === undefined || new_interactome.length < 1){
        console.error("Interactome (var new_interactome):");
        console.error(new_interactome);
        throw Error("Interactome can not be empty nor undefined");
    }
    if( !gene_set instanceof Set ){
        console.error("gene_set argument must be a set instead of: "+ gene_set.constructor.name);
        throw Error("gene_set argument must be a set");
    }

    let graph = {};
    graph.nodes = [];
    graph.links = [];

    gene_set.forEach( gene => {
        let interaction = new_interactome.find( el =>{ return parseInt(el.gene_ID_1) === parseInt(gene) || parseInt(el.gene_ID_2) === parseInt(gene) })
        if(interaction !== undefined){
            let node1 = {};
            let node2 = {};
            let link = {};

            node1.id = interaction.gene_ID_1;
            node1.symbol = interaction.gene_symbol_1;

            node2.id = interaction.gene_ID_2;
            node2.symbol = interaction.gene_symbol_2;

            link.source = interaction.gene_ID_1;
            link.target = interaction.gene_ID_2;

            if(node1.id !== node2.id){
                graph.links.push(link);
                graph.nodes.push(node1,node2);
            }
        }
    });

    if(graph.nodes.length < 2 || graph.links.length < 1 ){
        console.warn("filter_interactome_graph function returned an empty graph:");
        console.warn(graph);
    }
    return graph;

}

clean_graph = (graph) => {
    let new_graph = {};
    new_graph.nodes = [];
    new_graph.links = [];
    graph.nodes.forEach( node =>{
        if(new_graph.nodes.find(el=> el.id === node.id)===undefined){
            new_graph.nodes.push(node);
        }
    });
    new_graph.links = graph.links;
    d3.select("#titlegenes").text("Number of genes: "+new_graph.nodes.length);
    d3.select("#titlelinks").text("Number of interactions: "+new_graph.links.length);
    return new_graph;
}

/**
 * define nodes drag-drop simulation, might allow users to rearrange dense graph for better readability in case the
 * automatic display fails.
 * */
drag = simulation => {

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}



/**
 * takes as input a graph (generally from filter_interactome_graph) and draws it with the classical network representation
 * @param {Graph} data:  filtered interactome to be drawn (output of filter_interactome_graph)
 */
async function draw_graph(data){

    if( data.nodes===undefined||data.links===undefined){
        throw Error("Wrong draw_graph input: data must be a graph object");
    }

    //Set up the force layout
    let simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink(data.links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("x", d3.forceX().strength(0.1))
        .force("y", d3.forceY().strength(0.12));

    //init links
    let link = svg.select("#links-group")
        .selectAll("line")
        .data(data.links)
        .join(
            enter => enter.append("line")
                .attr("class", "link"),
            update => update,
            exit => exit.transition().duration(300).attr("r",1).remove()
        );


    //init nodes: hierarchy is
    // <g>
    //      <circle></circle>
    //      <text></text>
    //</g>
    let node = svg.select("#nodes-group")
        .selectAll(".node")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class","node")
        .on("mouseover",showtooltip)
        .on("mouseout",hidetooltip)
        .call(drag(simulation));

    let nodeLabels = node.append("text")
        .attr("class", "node-label")
        .attr("symbol", d => d.symbol)
        .attr("disease",  add_disease_attr)
        .attr('dy', 24)
        .attr("text-anchor", "middle")
        .text(d => d.symbol)
        .style("display",()=>{ return document.getElementById("show_labels").checked? "block":"none" })
        .style("font-family","sans-serif")
        .style("font-size",font_size_normal)
        .style("font-weight","bold")
        .style("fill", get_color)
    ;


    let nodeCircle = node.append("circle")
        .attr("class", "node-circle")
        .attr("symbol", d => d.symbol)
        .attr("disease",  add_disease_attr)
        .attr("r", radius_normal)
        //.style("fill", d =>{ color(d.disease) })
        .style("fill", get_color)
        .style("opacity", 0.7)
        .call(drag(simulation))
        .on("mouseover", circle_mouse_over)
        .on("mouseout", circle_mouse_out);

    function add_disease_attr(d,i){ //append metadata to nodes
        let diseases = d3.selectAll(`[symbol="${d.symbol}"]`).attr("disease");
        if (diseases === null){ //if this is the first time we see the node set disease attribute directly
            return d.disease;
        }
        //else add it separating with a withe space from other nodes if it is not inside the disease list yet
        let d_vect = diseases.split(" ");
        if( d_vect.find(disease=>{return disease == d.disease}) === undefined ){
            return diseases + " "+ d.disease;
        }
        return diseases; //if it was already inside return the list as it was
    }

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    simulation.on("tick", () =>  {
        link
            .attr("x1", function (d) {
                //return Math.max(0, Math.min(width, d.source.x));
                return d.source.x;
            })
            .attr("y1", function (d) {
                //return Math.max(0, Math.min(width, d.source.y));
                return d.source.y;
            })
            .attr("x2", function (d) {
                //return Math.max(0, Math.min(width, d.target.x));
                return d.target.x;
            })
            .attr("y2", function (d) {
                //return Math.max(0, Math.min(width, d.target.y));
                return d.target.y;
            });
        //adjust the node group (g element containing circles and text labels)
        node.attr("transform", d => `translate(${d.x}, ${d.y})`);

    });
}
/**
 * Scene fast initialization
 * */
function clean_scene(){
    d3.select("#links-group").remove();
    d3.select("#nodes-group").remove();
    svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr('id','nodes-group');
    svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr('id','links-group');
}

createTooltip = el => {
    el
        .attr("class", "tooltip")
        .style("border-radius", "3px")
        .style("pointer-events", "none")
        .style("display", "none")
        .style("position", "absolute")
        .style("z-index", "1000")
        .style("padding-left", "12px")
        .style("padding-right", "12px")
        .style("font-weight", "regular")
        .style("font-family", "Open Sans")
        .style("font-size", "0.65em")
        .style("background", "white")
        .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
        .style("color", "#333333")
        .style("line-height", "1.6")
        .style("pointer-events", "none");
}

showtooltip = (d)=>{
    tooltip.style("display", null);
    //console.log(); //.select(".node-circle").attr("disease")
    let txt = `ID: ${d.id}<br>Symbol: ${d.symbol}<br>Involved in:${d3.select(d3.event.target).attr("disease")}`;
    tooltip.html(`<p>${txt}</p>`)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}

hidetooltip = (d)=>{
    tooltip.style("display", "none");
}

circle_mouse_over = (d,i)=>{

    //reduce visibility of nodes and text
    d3.selectAll('.node-circle').style("opacity", 0.3).style("fill", "#aaaaaa");
    d3.selectAll('.node-label').style("opacity", 0.3);
    //highlight relevant nodes and labels
    d3.selectAll(`[disease~="${d.disease}"]`)
        .style("opacity", 0.7)
        .style("fill", get_color)
        .style("font-size", font_size_big);

}
circle_mouse_out = (d,i) => {
    d3.selectAll('.node').style("opacity", 1);
    d3.selectAll('.node-circle').style("opacity", 0.7).style("fill", get_color );
    d3.selectAll('.node-label').style("opacity", 1).style("font-size", font_size_normal);
    handleClickLegenda(null);
}

get_color = (d,i)=>{
    //gives color associated to a disease to the gene in the disease
    // r black if it is a linked gene but not specific of the disease
    let disease_genes_list = disease_gene_mapping.find(record => record.Diseases.replace(/[ ]+/g,"-")===d.disease);
    if(disease_genes_list===undefined){
        console.error(`error in get_color function: can not find the genes list of ${d.disease} -> 
                disease_gene_mapping.find returned ${disease_genes_list}`);
    }
    let disease_genes_set = new Set(disease_genes_list.Genes.split(","));
    if( disease_genes_set.has(d.id) ){
        return color(d.disease);
    }
    //return color("not-"+d.disease);
    return "#000000"

}

