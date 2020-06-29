
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
Array [ Object { "Drug Name": "Abacavir",
                 "Drug Indications": "For the treatment of HIV-1 [...]",
                 "Disease Name": "HIV",
                 "Disease Gene Names": "CCL5;IL10;CCR2;CCR5",
                 "Disease Gene Entrez Gene IDs": "6352;3586;1231;1234" }
      ...]
* */
var drug_disease_mapping = [];

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

var t0,t1;

var margin = {top: 20, right: 20, bottom: 30, left: 40};
var width = 800 - margin.left - margin.right;
var height = 800 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
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


(async ()=>{

    /*
    * READ ALL DATA
    * */

    //load disease-gene mapping
    t0 = performance.now();
    await d3.tsv('datasets/02__seeds.tsv', (record) =>{
        disease_gene_mapping.push(record);
        //if gene is not in  useful_genes_list add it to the list
        record.Genes.split(",").forEach(gene=>{
            useful_genes_list.add(parseInt(gene));
        });
    });
    t1 = performance.now();
    console.log(`Read and process of 02__seeds.tsv took ${t1 - t0} milliseconds.`);
    console.log("disease_gene_mapping")
    console.log(useful_genes_list);

    //load drug-gene mapping
    t0 = performance.now();
    await d3.tsv('datasets/03_Drug-target.tsv', (record) =>{

        drug_gene_mapping.push(record);
        //if gene is not in  useful_genes_list add it to the list
        record["Target Entrez Gene IDs"].split(";").forEach(gene=>{
            useful_genes_list.add(parseInt(gene));
        });
    });

    t1 = performance.now();
    console.log(`Read and process of 03_Drug-target.tsv took ${t1 - t0} milliseconds.`);
    console.log("drug_gene_mapping")
    console.log(useful_genes_list);

    //load drug-disease mapping
    t0 = performance.now();
    await d3.tsv('datasets/04_Drug-disease.tsv', (record) =>{

        drug_disease_mapping.push(record);

        record["Disease Gene Entrez Gene IDs"].split(";").forEach(gene=>{
            useful_genes_list.add(parseInt(gene));
        });

    });
    t1 = performance.now();
    console.log(`Read and process of 04_Drug-disease.tsv took ${t1 - t0} milliseconds.`);
    console.log("drug_disease_mapping")
    console.log(useful_genes_list);

    //load interactome
    t0 = performance.now();
    await  d3.tsv('datasets/01_Interactome.TSV', (record) =>{
        interactome.push(record);
    });

    //Init sidebar
    init_sidebar()

    /*
       FILTER THE INTERACTOME MAINTAINING ONLY USEFUL RECORDS
     * */
    new_interactome = [];
    interactome.forEach(record =>{
        if(useful_genes_list.has(parseInt(record.gene_ID_1)) || useful_genes_list.has(parseInt(record.gene_ID_2)) ){
            new_interactome.push(record);
        }
    });
    console.log(new_interactome);

    t1 = performance.now();
    console.log(`Read and process of 01_Interactome.TSV took ${t1 - t0} milliseconds.`);

})();

function draw_from_input(input_array){
    let full_graph = {};
    full_graph.nodes = [];
    full_graph.links = [];

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

        draw_graph(full_graph);

    }

}


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
        let interaction = new_interactome.find( el =>{ return parseInt(el.gene_ID_1) == parseInt(gene) || parseInt(el.gene_ID_2) == parseInt(gene) })
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

            graph.links.push(link);
            graph.nodes.push(node1, node2);
        }
    });

    if(graph.nodes.length < 2 || graph.links.length < 1 ){
        console.warn("filter_interactome_graph function returned an empty graph:");
        console.warn(graph);
    }
    return graph;

}


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



function draw_graph(data){

    if( data.nodes===undefined||data.links===undefined){
        throw Error("Wrong draw_graph input: data must be a graph object");
    }

    //Set up the force layout
    let simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink(data.links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    //init links
    let link = svg.select("#links-group")
        .selectAll("line")
        .data(data.links)
        .join(
            enter => enter.append("line")
                .attr("class", "link"),
            update => update,
            exit => exit
        );
        /*.enter()
        .append("line")
        .attr("class", "link");*/

    //init nodes
    let node = svg.select("#nodes-group")
        .selectAll("g")
        .data(data.nodes)
        .join(
        enter => enter.append("circle")
                .attr("class", "node")
                .attr("disease",  d => d.disease)
                .attr("symbol", d => d.symbol)
                .attr("r", 5)
                .style("fill", d => color(d.disease))
                .call(drag(simulation))
                .on("mouseover", (d,i)=>{ d3.selectAll('.node').style("opacity", 0.3).style("fill", "#aaaaaa"); d3.selectAll(`[disease~="${d.disease}"]`).style("opacity", 1).style("fill", d => color(d.disease)) })
                .on("mouseout", () =>{d3.selectAll('.node').style("opacity", 1).style("fill", d => color(d.disease))})
             ,
        update => update.attr("disease",  add_disease_attr).style("fill", d => color(d.disease)),
        exit => exit
    );


    function add_disease_attr(d,i){
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

        node
            .attr("cx", function (d) {
                //return Math.max(0, Math.min(width, d.x));
                return d.x ;
            })
            .attr("cy", function (d) {
                //return Math.max(0, Math.min(width, d.y));
                return d.y ;
            });
    });
}

