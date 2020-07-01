
bfs = (start_node_id, stop_node_id) =>{
    let visited = new Set();
    let frontier = []; // can not be a set since it must act like a queue and we need .shift() method to have FIFO logic
    let current = start_node_id;
    let goal = stop_node_id;
    if( current === goal ){ return current}

    let first_iteration = true;
    while(frontier.length > 0 || first_iteration){ //end when there are no more nodes in the graph
        first_iteration = false;
        visited.add(current); //mark the current node as visited to avoid infinite search due to cycles
        let node_front = get_frontier(current);
        node_front.forEach( neighbor =>{
            if(neighbor===goal){ //perform goal test to the nodes in the frontier
                return neighbor;
            }
            if( !visited.has(neighbor) ) { //add reachable nodes in the frontier if not visited yet
                if(!frontier.includes(neighbor)){  frontier.push(neighbor)}; //add reachable nodes in the frontier only once
            }
        })
        current = frontier.shift(); //pop the first
    }
    return null;
}

//TODO: add a findpath function and an extra data structure to be able to find paths in bfs and their costs

//TODO: precompute a map <node, SET of reachable nodes> to speedup the computation

//return set of ids
//highly dependent on the graph structure (real data)
get_frontier = (node_id) =>{
    let frontier = new Set();
    let filtered_links  = interactome.filter(link =>{return link.gene_ID_1 === node_id || link.gene_ID_2 === node_id }) ;
    filtered_links.forEach(link=>{
        if(link.gene_ID_1 !== node_id && link.gene_ID_2 === node_id ){
            frontier.add(link.gene_ID_1);
        }else{
            link.gene_ID_1 === node_id && link.gene_ID_2 !== node_id ? frontier.add(link.gene_ID_2) : null;//console.warn(`node_id is: ${node_id}; link in the interactome is:  {src:${link.gene_ID_1},tgt:${link.gene_ID_2}}. Check links filtering if this link should be in the frontier`);
        }
    });
    return frontier;
}

