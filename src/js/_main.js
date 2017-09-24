/*jshint esversion: 6 */

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