/*

TODO : 

*/
const appId = '653YPGRUJS'; /*Algolia default: *latency* mine: *653YPGRUJS* */
const apiKey = '67aebf7df47999607220ceb259829579'; /*Algolia default: *249078a3d4337a8231f1665ec5a44966* || mine: *67aebf7df47999607220ceb259829579*  */ 
//const indexName = 'test_BESTBUY'; /*Algolia default: *bestbuy* || mine: *test_BESTBUY* */

//Crawler handler function
function Site(){
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

	    	//DEV - 
	    	this.algolia.checkIndex();
	    }
	};

	this.setSystem = function(site){

		$.ajax({
       		url : 'back/scrapper.php',
       		type : 'GET',
       		data: {action: 'checkSystem', url: site.url},
       		dataType : 'json',
       		success : function(data, status, jqXHR){

       			if('error' in data){
       				tcons('Erreur => ' . data.error);
       			}else{
       				tcons('Système détecté : ' + data.success);

       				site.system = data.success;
       				site.conf = conf[site.system];
       				
       				site.fetchCategories(site);


       			}
       		},
       		error : function(error, status, jqXHR){
       			cons('error');
       			cons(error);
       			cons(status); 
       			cons(jqXHR);
       		}
    	});
	}

	this.fetchCategories = function(site){
		tcons('Starting to fetch your categories, depending on your server, it could take a few minutes.');
		tcons('Here is a video to watch if you want, you\'ll be redirect as soon as we\'re done !');
		tcons('<div class="" style="position: absolute; right: 0; bottom:2em;"><iframe class="embed-responsive-item" src="https://www.youtube-nocookie.com/embed/vGXJANUkOPw" frameborder="0" allowfullscreen></iframe></div>');

		$.ajax({
       		url : 'back/scrapper.php',
       		type : 'GET',
       		data: {action: 'fetchCats', url: site.url, system: site.system},
       		dataType : 'json',
       		success : function(data, status, jqXHR){

       			//here we've got the cats tree
       			site.cats = data.cats;	

       			catsLength = Object.keys(site.cats).length;
       			
       			//if no cats were found, let's cancel the operation
       			if(catsLength < 1){
       				tcons('No categories were found. We\'ll stop here unfortunately...');
       				return false;
       			}

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
						})
					}
				}

				site.catsInArray = [];

				parseCategories(site, site.cats);

				function crumbCategories(object) {
				   
				    Object.keys(object).forEach(function (k) {

				        if (object[k] && typeof object[k] === 'object' && !Array.isArray(object[k])){

				            object[k].categories = (object.categories || []).concat(k);
				            crumbCategories(object[k]);

				        }

				    });
				}

				crumbCategories(site.cats);

				//DEV site.catsInArray = [{name: "gift-certificates", url: "https://xeroshoes.com/shop/product-category/gift-certificates/"}];

				//we must have at least one cats so no need to check for specific count here. 
				tcons(site.catsInArray.length + ' cats were found. Now parsing...');

				site.maxPerCat = Math.floor(site.maxProducts / site.catsInArray.length);

				//DEBUG EASIER : 
				//site.catsInArray = site.catsInArray.slice(0,3);

				//We launch site.maxAsync cats in parrallel to avoid taking to much time.
				for(i=0; i < site.maxAsync; i++){
					site.handlePromisebyWave(site, i);
				}
       			
       		},
       		error : function(error, status, jqXHR){
       			tcons('We were not able to fetch your categories.');
       			cons(error);
       		}
    	});
	}

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
	}

	this.fetchProductsUrl = function(resolve, reject, site, index, credit){

		var cat = site.catsInArray[index].name;
		var catUrl = site.catsInArray[index].url;

		$.ajax({
       		url : 'back/scrapper.php',
       		type : 'GET',
       		data: {action: 'fetchCat',system: site.system, url: catUrl, maxPerCat: credit},
       		dataType : 'json',
       	}).then(function(data){

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

       			function parseCategories(site, cats){
					if(typeof cats === 'object'){
						
						$.each(cats, function(i,v){	
							//if we only have a "url" object, then we're on last branch and can parse it
							if(Object.keys(v).length === 2 && 'url' in v && cat === i){

								//Sometime, the root or URL is not in the link. Then we must add it
								var regex = /^http/g;
								$.each(products, function(i,v){
									if(!regex.test(i)){
										newIndex = 'http://'+site.url+i;
										products[newIndex] = v;
										delete products[i];
									}
								})

								v.products = products;
								
								//No need to make promise on nothing ;)
								if(dataLength > 0){
									var FPU = new Promise(function (res, rej){
										site.fetchProduct(res, rej, site, v, cat)
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
						})

					}
				}

				parseCategories(site, site.cats);

		    }

       	});
	}

	this.fetchProduct = function(res, rej, site, catObject, cat){

		function getProductData(url){

			//return products[url] = Math.random() * 100;
			$.ajax({
	       		url : 'back/scrapper.php',
	       		type : 'GET',
	       		data: {action: 'fetchProduct',system: site.system, url: url},
	       		dataType : 'json',
	       		beforeSend: function(){
	       			//so we're sure we don't launch twice the same url;
	       			catObject.products[url] = -1;
	       		}
	       	}).then(function(data){

	       		if('error' in data){
	       			tcons('An error occured while trying to get one product');
	       			cons(data);
	       			catObject.products[url] = {false: false};

	       			//No need to cry, we can still continue
	       			//Then we relaunch again with the same var
		       		site.fetchProduct(res, rej, site, catObject, cat);

	       		}else{

	       			/*
					What do we need at least to add a product : name and price
	       			*/
	       			if(data.name != '' && data.price != ''){
		       			var crumb = catObject.categories;

		       			var trace = '';
		       			$.each(crumb, function(i,v){
		       				var catName = v.replace(/[^\w\s]/gi, ' ').capitalize();

		       				data.categories = (data.categories || []).concat(catName);

		       				data.hierarchicalCategories = (data.hierarchicalCategories || {});
		       			
		       				data.hierarchicalCategories['lvl'+i] = trace + catName;

		       				trace += catName + ' > ';
		       			});

						data.popularity = false;
						data.rating = false;

		       			catObject.products[url] = data;

		       			site.batch.push(data);	     

		       			//Let's show the progress !
		       			$('#' + cat).text(parseInt($('#' + cat).text()) + 1);  				 
		       		}else{
		       			cons('One product was rejected due to some lack of informations');
	       				catObject.products[url] = {false: false};
		       		}	

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
	}
};

//Algolia CRUD - Work on Index parameters with crawl results
function Algolia(site){

	$this = site;

	this.checkIndex = function (){
		
		$.ajax({
       		url : 'back/algolia.php',
       		type : 'GET',
       		data: {action: 'checkIndex', indexName: $this.url},
       		dataType : 'json',
       		success : function(data, status, jqXHR){
       			if(data === true){
       				tcons('This site already has an Algolia index !');
       				$this.algolia.startSearch();
       			}else if(data === false){
       				//we need to setSystem
       				$this.setSystem($this);
       			}
       		}
       	});
	};

	this.createIndex = function(){
		cons('createIndex is started');

		//We'll use the indexName to store the system type in order to retrieve it at anytime
		switch($this.system) {
    		case 'woocommerce':
        		var indexName = 'WC-'+$this.url;
        	break;
        	case 'shopify':
        		var indexName = 'SY-'+$this.url;
        	break;
        	default:
        		//should never happen cause we can't get there without knowing the system...
        		var indexName = $this.url;
        	break;
        };

		$.ajax({
       		url : 'back/algolia.php',
       		type : 'POST',
       		data: {action: 'createIndex', indexName: indexName, batch: JSON.stringify($this.batch)},
       		dataType : 'json',
       		success : function(data, status, jqXHR){
       			if(typeof data === 'object' && 'error' in data){
       				tcons(data.error);
       				cons(data);
       				cons(status);
       				cons(jqXHR);
       			}else if(data){
       				tcons('Congratulations, your products are now in an Algolia index !');
       				$this.algolia.startSearch();
       			}
       		}
       	});
	};

	this.startSearch = function(){
		cons('LETS GO SEARCH!')
		//DEV - window.location.pathname = 'algolia.html/'+'#'+$this.url;
	}
}

//Algolia READONLY - Init all Algolia libraries on ecommerce page
function Search(){

	this.hashChange = function(indexName){
		
		var input = '<input id="search-input" class="form-control" placeholder="Search on '+indexName.substr(3).capitalize()+'"  aria-label="Search on '+indexName.substr(3).capitalize()+'" >';
		$('#ecommerce-form').html(input);

		this.initAutoComplete(indexName);
		
		this.initInstantSearch(indexName);
	}

	this.initInstantSearch = function(indexName){

		cons('new instantsearch ==> ' + indexName)
		
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
				collapsible: true,
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

	}

	this.initAutoComplete = function(indexName){

		cons('Autocomplete is init for index ==> ' + indexName);
		var client = algoliasearch(appId, apiKey)
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
	}
}

//Generate indices link into navbar dropdown
function getIndices(){
	$.ajax({
    	url : 'back/algolia.php',
    	type : 'GET',
    	data: {action: 'getIndices'},
    	dataType : 'json',
    	success : function(data, status, jqXHR){

    		var menu = $('#menu-dropdown > div.dropdown-menu');
    		menu.find('.alg-index').remove();

    		$.each(data.items, function(i,v){
    			menu.append('<a class="dropdown-item alg-index" href="/algolia/algolia.html#'+v.name+'">'+v.realName+'</a>');
    		})

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
}

function cons(a){console.log(a)};
//Seems like the perfect component to learn / start with Vuejs
function tcons(a){
	$('#console').append('>' + a + '<br/>');
	$("#console-container").scrollTop($("#console-container")[0].scrollHeight);
};