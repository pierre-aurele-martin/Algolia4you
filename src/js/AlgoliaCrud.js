/*jshint esversion: 6 */
//Algolia CRUD - Work on Index parameters with crawl results
function Algolia(site){

	$this = site;

	this.checkIndex = function (){

		var indexName = this.cheatSystem();

		$.ajax({
       		data: {action: 'algolia/checkIndex', indexName: indexName},
       		success : function(data, status, jqXHR){
       			
                if(typeof data === 'object' && 'success' in data){
                    if(data === true){
           				//We check if the user asked for a Reindex
           				if($('#force-reindex').is(':checked')){
           					$this.algolia.deleteIndex();
           				}else{
           					tcons('This site already has an Algolia index !');
           					$this.algolia.startSearch();
           				}
           			}else if(data === false){
           				//we need to create an index
           				$this.fetchCategories($this);
           			}
                }else{
                    tcons('An error happened in checking Algolia index.');
                    cons(data);
                }
       		}
       	});
	};

	this.cheatSystem = function(){

		var indexName;
		switch($this.system) {
    		case 'woocommerce':
        		indexName = 'WC-'+$this.url;
        	break;
        	case 'shopify':
        		indexName = 'SY-'+$this.url;
        	break;
        	default:
        		//should never happen cause we can't get there without knowing the system...
        		indexName = $this.url;
        	break;
        }

        return indexName;
	};

	this.createIndex = function(){
		//We'll use the indexName to store the system type in order to retrieve it at anytime
		var indexName = this.cheatSystem();

		$.ajax({
       		type : 'POST',
       		data: {action: 'algolia/createIndex', indexName: indexName, batch: JSON.stringify($this.batch)},
       		success : function(data, status, jqXHR){
       			
                if(typeof data === 'object' && 'success' in data){
       				tcons('Congratulations, your products are now in an Algolia index ! ');
       				tcons('You\'ll see your new search engine in a few seconds...');
       				
       				var wait = setTimeout(function(){
       					$this.algolia.startSearch();
       				}, 3500);
       			}else{
                    tcons(data.error);
                    cons(data);
                    cons(status);
                    cons(jqXHR);
                }
       		}
       	});
	};

	this.deleteIndex = function(){
		//We'll use the indexName to store the system type in order to retrieve it at anytime
		var indexName = this.cheatSystem();

		$.ajax({
       		type : 'POST', //DELETE seems to be more problem...
       		data: {action: 'algolia/deleteIndex', indexName: indexName},
       		success : function(data, status, jqXHR){

       			if(typeof data === 'object' && 'error' in data){
       				tcons(data.error);
       				cons(data);
       				cons(status);
       				cons(jqXHR);
       			}else if(typeof data === 'object' && 'success' in data){
       				tcons('The previous index just get erased.');
       				//Let's start from 0;
       				$this.fetchCategories($this);
       			}else{
       				tcons('An error happened while trying to delete the index. Aborted.');
       				return false;
       			}
       		}
       	});
	};

	this.startSearch = function(){
		var indexName = this.cheatSystem();
		document.location.href = 'algolia.html#'+indexName;
	};
}
