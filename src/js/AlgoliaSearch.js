/*jshint esversion: 6 */
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
