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
                    if(data.success === true){
           				//We check if the user asked for a Reindex
           				if($('#force-reindex').is(':checked')){
           					$this.algolia.deleteIndex();
           				}else{
           					tcons('This site already has an Algolia index !');
           					$this.algolia.startSearch();
           				}
           			}else if(data.success === false){
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
;/*jshint esversion: 6 */
//Algolia READONLY - Init all Algolia libraries on ecommerce page
function Search(){

	this.hashChange = function(indexName){
		
		var input = '<input id="search-input" class="form-control" placeholder="Search on '+indexName.substr(3).capitalize()+'"  aria-label="Search on '+indexName.substr(3).capitalize()+'" >';
		$('#ecommerce-form').html(input);

		this.initAutoComplete(indexName);
		
		this.initInstantSearch(indexName);
	};

	this.initInstantSearch = function(indexName){
		
		var search = instantsearch({
			appId: appId,
			apiKey: apiKey,
			indexName: indexName,
			urlSync: false,
			hitsPerPage: 20,
		});

		//binding search bar
		search.addWidget(
			instantsearch.widgets.searchBox({
		    	container: '#search-input',
		    	poweredBy: true,
		    	searchOnEnterKeyPressOnly: false,
			})
		);

		//Infinite hits 
		search.addWidget(
			instantsearch.widgets.infiniteHits({
		    	container: '#hits',
		    	templates: {
		      		item: $('#hit-template').html(),
					empty: "We didn't find any results for the search <em>\"{{query}}\"</em>",
		    	},
		    	hitsPerPage: 3
	  		})
		);

		//hierarchical menus
		search.addWidget(
			instantsearch.widgets.hierarchicalMenu({
				collapsible: {collapsed: (window.innerWidth <= 1200)},
	    		container: '#hierarchical-categories',
	    		attributes: ['hierarchicalCategories.lvl0', 'hierarchicalCategories.lvl1', 'hierarchicalCategories.lvl2', 'hierarchicalCategories.lvl3'],
	    		templates: {
	      			header: '<h4><span class="oi oi-project"></span> Categories tree:  </h4>',
	      			item: function(data){
	      				var link = '> <a class="ais-hierarchical-menu--link" href="'+data.url+'">'+data.label+' <span class="ais-hierarchical-menu--count"> (' + data.count + ') </span></a>';
	      				//'{name}',//Item template, provided with name, count, isRefined, url data properties
	      				return link;
	      			}
	    		}
	  		})
		);

		//refinementList
		search.addWidget(
			instantsearch.widgets.refinementList({
				collapsible: {collapsed: (window.innerWidth <= 1200)},
	    		container: '#brands',
	    		attributeName: 'brand',
	    		operator: 'or',
	    		limit: 10,
	    		templates: {
	      			header: '<h4><span class="oi oi-list"></span> Brand(s) filter:  </h4>'
	    		}
	  		})
		);

		//rangeSlide
		search.addWidget(
			instantsearch.widgets.rangeSlider({
	    		container: '#price',
	    		attributeName: 'price',
	    		templates: {
	      			header: '<h4> <span class="oi oi-dollar"></span> Price range: </h4>'
	    		},
	    		tooltips: {
	      			format: function(rawValue) {
	        			return '$' + Math.round(rawValue).toLocaleString();
	      			}
	    		}
	  		})
		);

		//clear All
		search.addWidget(
			instantsearch.widgets.clearAll({
	    		container: '#clear-all',
	    		templates: {
	      			link: '<span class="oi oi-circle-x"></span> Clear filters'
	    		},
	    		autoHideContainer: true
	  		})
		);

		search.addWidget(
			instantsearch.widgets.stats({
    			container: '#stats-container'
  			})
		);

		search.start();

	};

	this.initAutoComplete = function(indexName){

		cons('Autocomplete is init for index ==> ' + indexName);
		var client = algoliasearch(appId, apiKey);
		var index = client.initIndex(indexName);
		
		$('#search-input').autocomplete(
			{
				hint: false,
				debug:true,
			},
			[{
		    	source: $.fn.autocomplete.sources.hits(index, { hitsPerPage: 5 }),
		    	displayKey: 'name',
		    	templates: {
		        	suggestion: function(suggestion) {
		        		return '<span>' +
	            				suggestion._highlightResult.name.value + '</span>';
		        	}
		    	}
		    }
			]
		).on('autocomplete:selected', function(event, suggestion, dataset) {
		   	//console.log(suggestion, dataset);
		});
	};
}
;/*jshint esversion: 6 */
//Crawler handler function
function Site(){
	this.inProgress = false;
	this.url = false;
	this.maxProducts = 500;
	this.maxPerCat = 0;
	this.extraCredit = 0;
	this.maxAsync = 3;
	this.cats = [];
	this.cntProducts = 0;
	this.batch = [];
	this.trackPromises = 0;

	this.algolia = new Algolia(this);

	this.setUrl = function(url){

	    // strip off "http://" and/or "www."
	    url = url.replace("http://","").replace("https://","").replace("www.","");

    	var regex = /^([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?)\/?(\S*)/;
	    
	    if (regex.test(url) === false) {

	    	$('#url-addon-1, #url-addon-2').css('background-color', '#f77171');
	    	this.url = false;

	    }else{

	    	var match = url.match(regex);
	    	this.url = match[1];
	    	$('#url-addon-1, #url-addon-2').css('background-color', '#a6f3a6');

	    	inputs.attr('readonly', true);

	    	this.setSystem();
	    }
	};

	this.setSystem = function(){

		$.ajax({
       		data: {action: 'scrapper/checkSystem', url: this.url},
       		success : function(data, status, jqXHR){

       			if('error' in data){
       				tcons('Erreur => ' . data.error);
       				return false;
       			}else{
       				tcons('Système détecté : ' + data.success);

       				site.system = data.success;
       				site.conf = conf[site.system];
       				
       				site.algolia.checkIndex();

       			}
       		},
       		error : function(error, status, jqXHR){
       			cons('error');
       			cons(error);
       			cons(status); 
       			cons(jqXHR);
       			return false;
       		}
    	});
	};

	this.fetchCategories = function(site){
		tcons('Starting to fetch your categories, depending on your server, it could take a few minutes.');
		tcons('Here is a video to watch if you want, you\'ll be redirect as soon as we\'re done !');
		tcons('<div class="" style="position: absolute; right: 0; bottom:2em;"><iframe class="embed-responsive-item" src="https://www.youtube-nocookie.com/embed/vGXJANUkOPw" frameborder="0" allowfullscreen></iframe></div>');

		$.ajax({
       		data: {action: 'scrapper/fetchCats', url: site.url, system: site.system},
       		success : function(data, status, jqXHR){

       			//now we need to go throught all tree and add the cats to a list that we'll parse
	       		function parseCategories(site, a){
					
					if(typeof a === 'object'){

						$.each(a, function(i,v){

							//if we only have a "url" object, then we're on last branch and can parse it
							if(Object.keys(v).length === 1 && 'url' in v){

								site.catsInArray.push({'name': i, 'url': v.url});								

							}else{ // then we need to go deeper in the tree
								//Let's enjoy this loop to build the category tree for Algolia

								parseCategories(site, v);
							}
						});
					}
				}

				function crumbCategories(object) {
				   
				    Object.keys(object).forEach(function (k) {

				        if (object[k] && typeof object[k] === 'object' && !Array.isArray(object[k])){

				            object[k].categories = (object.categories || []).concat(k);
				            crumbCategories(object[k]);

				        }

				    });
				}

       			if('success' in data){

	       			//here we've got the cats tree
	       			site.cats = data.success.cats;	

	       			//Shopify allow us to get a full Crawl at this step
	       			if(site.system === 'shopify'){

	       				$.each(site.cats, function(catName,v){
	       					$.each(v.products, function(index, product){
	       						site.batch.push(product);
	       					});
	       				});

	       				return site.algolia.createIndex();
	       			}

	       			catsLength = Object.keys(site.cats).length;
	       			
	       			//if no cats were found, let's cancel the operation
	       			if(catsLength < 1){
	       				tcons('No categories were found. We\'ll stop here unfortunately...');
	       				return false;
	       			}

					site.catsInArray = [];

					parseCategories(site, site.cats);

					
					crumbCategories(site.cats);

					//we must have at least one cats so no need to check for specific count here. 
					tcons(site.catsInArray.length + ' cats were found. Now parsing...');

					site.maxPerCat = Math.floor(site.maxProducts / site.catsInArray.length);

					//DEBUG EASIER : site.catsInArray = site.catsInArray.slice(0,3);

					//We launch site.maxAsync cats in parrallel to avoid taking to much time.
					for(i=0; i < site.maxAsync; i++){
						site.handlePromisebyWave(site, i);
					}

       			}else{
       				tcons('We were not able to fetch your categories.');
	       			cons(data.error);
	       			return false;
       			}  			
       		},
       		error : function(error, status, jqXHR){
       			tcons('We were not able to fetch your categories.');
       			cons(error);
       			return false;
       		}
    	});
	};

	this.handlePromisebyWave = function(site, index){

		if(index in site.catsInArray){
			var res = new Promise(function(resolve, reject){
					//As we launch site.maxAsync call, we need to divide the extra credit in maxAsync
					//That's a risk of losing products in some conditions but I don't have other ideas... at least without rewriting too much for now
					var extra = Math.floor(site.extraCredit / site.maxAsync);

					//OF course, we always have our default cat credit to add
					var credit = (site.maxPerCat + extra);

					site.fetchProductsUrl(resolve, reject, site, index, credit);

					//we remove the extra we used. 
					site.extraCredit -= extra;

				}).then(function(result){
					site.handlePromisebyWave(site, (index + site.maxAsync));
					site.trackPromises++;
				});
		}else if(site.trackPromises === (site.catsInArray.length - 1)){
			tcons('All your products has been fetched.');
			site.algolia.createIndex();
		}
	};

	this.fetchProductsUrl = function(resolve, reject, site, index, credit){

		var cat = site.catsInArray[index].name;
		var catUrl = site.catsInArray[index].url;

		$.ajax({
       		data: {action: 'scrapper/fetchCat',system: site.system, url: catUrl, maxPerCat: credit},
       	}).then(function(data){

       		function parseCategories(site, cats){
				if(typeof cats === 'object'){
					
					$.each(cats, function(i,v){	
						//if we only have a "url" object, then we're on last branch and can parse it
						if(Object.keys(v).length === 2 && 'url' in v && cat === i){

							//Sometime, the root or URL is not in the link. Then we must add it
							var regex = /^http/;
							$.each(products, function(i,v){
								
								if(regex.test(i) === false){
									newIndex = 'http://'+site.url+i;
									products[newIndex] = v;
									delete products[i];
								}

							});

							v.products = products;
							
							//No need to make promise on nothing ;)
							if(dataLength > 0){
								var FPU = new Promise(function (res, rej){
									site.fetchProduct(res, rej, site, v, cat);
								}).then(function(result){
									//so we can resolve upper promise
									resolve(true);

								}).catch(function(result){
									tcons('An error append while getting your products. Sorry.');
									cons(result);
									reject(false);
								});
							}else{
								//If we don't have any products, we can directly resolve here
								resolve(true);
							}


						}else if(typeof v == 'object' && !('products' in v)){ // then we need to go deeper in the tree
							parseCategories(site, v);
						}
					});

				}
			}

       		if('error' in data){
       			tcons('An error occured while fetching products from your cats.');
       			cons(data);
       			//That's ok, may be there is a good reason !
       			resolve(true);

       		}else if('success' in data){

       			var products = data.success;
       			
       			dataLength = Object.keys(products).length;

       			//Not used but why not
       			site.cntProducts += dataLength;
       			
       			//If we don't use all our credit, we increment the general credit
       			site.extraCredit += (credit - dataLength);

       			tcons('<span id="'+cat+'">0</span> / '+dataLength + ' products crawled in category ' + cat);

				parseCategories(site, site.cats);

		    }
       	});
	};

	this.fetchProduct = function(res, rej, site, catObject, cat){

		function getProductData(url){

			//return products[url] = Math.random() * 100;
			$.ajax({
	       		data: {action: 'scrapper/fetchProduct',system: site.system, url: url},
	       		beforeSend: function(){
	       			//so we're sure we don't launch twice the same url;
	       			catObject.products[url] = -1;
	       		}
	       	}).then(function(data){

	       		if('success' in data){

	       			/*
					What do we need at least to add a product : name and price
	       			*/
	       			var product = data.success;

	       			if((product.name !== '' && product.name !== null) && (product.price !== '' && product.price !== null)){
		       			var crumb = catObject.categories;

		       			var trace = '';
		       			$.each(crumb, function(i,v){
		       				var catName = v.replace(/[^\w\s]/gi, ' ').capitalize();

		       				product.categories = (product.categories || []).concat(catName);

		       				product.hierarchicalCategories = (product.hierarchicalCategories || {});
		       			
		       				product.hierarchicalCategories['lvl'+i] = trace + catName;

		       				trace += catName + ' > ';
		       			});

						product.popularity = false;
						product.rating = false;

		       			catObject.products[url] = product;

		       			site.batch.push(product);	     

		       			//Let's show the progress !
		       			$('#' + cat).text(parseInt($('#' + cat).text()) + 1);  				 
		       		}else{
		       			cons('One product was rejected due to some lack of informations');
	       				catObject.products[url] = {false: false};
		       		}	

		       		//Then we relaunch again with the same var
		       		site.fetchProduct(res, rej, site, catObject, cat);	

	       		}else{
	       			tcons('An error occured while trying to get one product. It\'s not as bad as it look, we continue...');
	       			cons(data);
	       			catObject.products[url] = {false: false};

	       			//No need to cry, we can still continue
	       			//Then we relaunch again with the same var
		       		site.fetchProduct(res, rej, site, catObject, cat);
	       		}

	       	});
		}

		var avoidAsync = 0;
		var cntDone = 0;
		$.each(catObject.products, function(i,v){

			if(avoidAsync === 0 && v === 1){
				getProductData(i);
				avoidAsync++;
			}else if(typeof v === 'object'){
				cntDone++;
				if(cntDone === Object.keys(catObject.products).length){
					res(true);
				}
			}
		});
	};
}
;/*jshint esversion: 6 */

const appId = '653YPGRUJS'; /*Algolia default: *latency* mine: *653YPGRUJS* */
const apiKey = '67aebf7df47999607220ceb259829579'; /*Algolia default: *249078a3d4337a8231f1665ec5a44966* || mine: *67aebf7df47999607220ceb259829579*  */ 
//const indexName = 'test_BESTBUY'; /*Algolia default: *bestbuy* || mine: *test_BESTBUY* */


//Generate indices link into navbar dropdown
function getIndices(){
	$.ajax({
    	data: {action: 'algolia/getIndices'},
    	success : function(data, status, jqXHR){

            if('success' in data){
        		var menu = $('#menu-dropdown > div.dropdown-menu');
        		menu.find('.alg-index').remove();

        		$.each(data.success.items, function(i,v){
        			menu.append('<a class="dropdown-item alg-index" href="algolia.html#'+v.name+'">'+v.realName+'</a>');
        		});

            }else{
                tcons('We were not able to get our indices. Our site is down (not algolia).');
                cons(data);
                return false;
            }

    		//Debug
    		//var item = menu.find('.alg-index:eq(0)');
    		//item[0].click();

    	},
    	error : function(error, status, jqXHR){
    		cons('error');
    		cons(error);
    		cons(status); 
    		cons(jqXHR);
    	}
    });
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function cons(a){console.log(a);}
//Seems like the perfect component to learn / start with Vuejs
function tcons(a){
	$('#console').append('>' + a + '<br/>');
	$("#console-container").scrollTop($("#console-container")[0].scrollHeight);
}

//Define some ajax setup to go DRY
$.ajaxSetup({
    url: "back/router.php",
    dataType: 'json',
    type: 'GET'
 });