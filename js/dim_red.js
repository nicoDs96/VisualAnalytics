/**
 * This library will is used as
 *
 * mds_classic(get_diseases_distance_matrix(),2);
 *
 * */


/**
 * return the jaccard similarity of the sets passed as argument
 * @param {ArrayLike<T>} set_1
 * @param {ArrayLike<unknown>} set_2
 */
get_jaccard_similarity = (set_1, set_2) =>{
    let intersect_size =  Array.from(set_1).filter(el => set_2.has(el)).length;

    let union = new Set(Array.from(set_1).concat(Array.from(set_2)));
    let js = intersect_size/union.size;
    if(isNaN(js) || js == "Infinity"){
        js = 0;
    }
    return js ;
}

/**
 * Returns the distance matrix computed from disease_gene_mapping array
 * */
get_diseases_distance_matrix = () => {
    let size = disease_gene_mapping.length;
    let distance_matrix = init_matrix(size);
    let i, j;
    for(i=0;i<size;i++){
        for(j=0; j<size; j++){
            distance_matrix[i][j] = 1 - get_jaccard_similarity(
                new Set(disease_gene_mapping[i].Genes.split(",")),
                new Set(disease_gene_mapping[j].Genes.split(","))
            );
        }
    }
    return distance_matrix;
}

/**
 * Returns a size*size squared matrix
 * @param {number} size  of the squared matrix rows
 * */
init_matrix = (size) =>{
    let matrix = [];
    for(let i=0; i<size; i++) {
        matrix[i] = new Array(size);
    }
    return matrix;
}

/**
 * Computes Multidimensioanl scaling.
 * @author benfred
 * @source https://github.com/benfred/mds.js
 * @param {number} distances a squared simmetrixc matrix of distances
 * @param {*|number} dimensions number of dimensions data will be reduced to
 * */
mds_classic = (distances, dimensions) => {
    dimensions = dimensions || 2;

    // square distances
    var M = numeric.mul(-.5, numeric.pow(distances, 2));

    // double centre the rows/columns
    function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
    var rowMeans = mean(M),
        colMeans = mean(numeric.transpose(M)),
        totalMean = mean(rowMeans);

    for (var i = 0; i < M.length; ++i) {
        for (var j =0; j < M[0].length; ++j) {
            M[i][j] += totalMean - rowMeans[i] - colMeans[j];
        }
    }

    // take the SVD of the double centred matrix, and return the
    // points from it
    var ret = numeric.svd(M),
        eigenValues = numeric.sqrt(ret.S);
    return ret.U.map(function(row) {
        return numeric.mul(row, eigenValues).splice(0, dimensions);
    });
};

