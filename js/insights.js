
/*
Array [ Object { Diseases: "adrenal gland diseases",
                    Genes: "3758,215,3762,1589,1585,6770,2516,6557,5573,2778,7809,1584,1586,51,1187,190,3284,7157"
               }
       ... ]
* */
var disease_gene_mapping;

/*
Array [ Object { "Drug Name": "Abarelix",
                "Number of Targets": "1",
                "Traget Gene Names": "GNRHR",
                "Target Entrez Gene IDs": "2798"
                }
       ... ]
* */
var drug_gene_mapping;

/*
Array [ Object { "Drug Name": "Abacavir",
                 "Drug Indications": "For the treatment of HIV-1 [...]",
                 "Disease Name": "HIV",
                 "Disease Gene Names": "CCL5;IL10;CCR2;CCR5",
                 "Disease Gene Entrez Gene IDs": "6352;3586;1231;1234" }
      ...]
* */
var drug_disease_mapping;

var interactome;

var useful_genes_list = new Set([]);


(async ()=>{

    /*
    * READ ALL DATA
    * */
    await d3.tsv('datasets/02__seeds.tsv', (data) =>{
        disease_gene_mapping = data;

        disease_gene_mapping.forEach(record =>{
            //if gene is not in  useful_genes_list add it to the list
            record.Genes.split(",").forEach(gene=>{
                useful_genes_list.add(parseInt(gene));
            });
        });
        console.log("disease_gene_mapping")
        console.log(useful_genes_list);

    });

    await d3.tsv('datasets/03_Drug-target.tsv', (data) =>{
        drug_gene_mapping = data;

        drug_gene_mapping.forEach(record =>{
            //if gene is not in  useful_genes_list add it to the list
            record["Target Entrez Gene IDs"].split(";").forEach(gene=>{
                useful_genes_list.add(parseInt(gene));
            });
        });

        console.log("drug_gene_mapping")
        console.log(useful_genes_list);

    });

    await d3.tsv('datasets/04_Drug-disease.tsv', (data) =>{
        drug_disease_mapping = data;

        drug_disease_mapping.forEach(record =>{
            //if gene is not in  useful_genes_list add it to the list
            record["Disease Gene Entrez Gene IDs"].split(";").forEach(gene=>{
                useful_genes_list.add(parseInt(gene));
            });
        });

        console.log("drug_disease_mapping")
        console.log(useful_genes_list);
    });

    await  d3.tsv('datasets/01_Interactome.TSV', (data) =>{
        interactome = data;
        console.log(interactome.length);
        /*
        * FILTER THE INTERACTOME MAINTAINING ONLY USEFUL RECORDS
        * */
        new_interactome = [];
        interactome.forEach(record =>{
           if(useful_genes_list.has(parseInt(record.gene_ID_1)) | useful_genes_list.has(parseInt(record.gene_ID_2)) ){
               new_interactome.push(record);
           }
        });
        console.log(new_interactome);
    });



})();
