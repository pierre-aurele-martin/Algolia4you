<?php
/*
TO DO 
	Deal with multiple images
	Deal with rating and popularity
	Deal with color
	Deal with multi currencies
*/

require_once('../libraries/curl/curl.php');
$GLOBALS['CONF'] = json_decode(file_get_contents('../config.json'), TRUE);

//var_dump($GLOBALS['CONF']);


//Dirtiest rooter you've ever saw...but works :)
if(!empty($_GET)){
	switch ($_GET['action']) {
		case 'checkSystem':
			//var_dump($_GET);
			exit(returnJSON(checkSystem($_GET['url'])));
		break;

		case 'fetchCats':
			//var_dump($_GET);
			exit(returnJSON(fetchCats($_GET['url'], $_GET['system'])));
		break;

		case 'fetchCat':
			//var_dump($_GET);
			exit(returnJSON(fetchCat($_GET['url'], $_GET['system'], (int)$_GET['maxPerCat'])));
		break;

		case 'fetchProduct':
			//var_dump($_GET);
			exit(returnJSON(getProduct($_GET['url'], $_GET['system'])));
		break;

		default:
			exit(returnJSON(array()));
		break;
	}
}


//this function is design for WooCommerce actually
function fetchCats($url, $system){

	//Get the cats of a system. Only work on Woocommerce for now

	$conf = $GLOBALS['CONF'][$system];
	$catUrl = $url . $conf['categories']['url'];
	
	$regex = '/'.$url.'\/(.*)/';
	$content = getHtml($catUrl);

	$xml = new SimpleXMLElement($content->response);

	$cats = array();
	
	foreach ($xml as $url){

		$str = $url->loc;
		preg_match_all($regex, $str, $matches, PREG_SET_ORDER, 0);

		$catRoot = str_replace('product-category/', '', $matches[0][1]);
		wooProcessChildren($catRoot, $cats, (string)$str);
		
	}

	return array('cats' => $cats);
}

//this function is design for WooCommerce actually - but this function is suppose to be quiet easy to adapt
function fetchCat($url, $system, $maxPerCat){

	$conf = $GLOBALS['CONF'][$system];
	$productXpaths = $conf['products']['product'];
	$pagePattern = $conf['products']['paging'];
	$pageIndex = 1;

	$workingProductXpath = false;
	$productsUrls = array();

	$results = getProductsUrl($pageIndex, $pagePattern, $url, $productXpaths, $productsUrls, count($productsUrls), $maxPerCat);

	return $results;
}

function getProductsUrl($pageIndex, $pagePattern, $url, $productXpaths, $productsUrls, $previousCount, $maxPerCat){

	$html = getHtml($url);

	//var_dump($html);

	if($html->http_status_code !== 200){
		if(count($productsUrls) === 0){
			return array('error' => $html->error_message);
		}else{
			return array('success' => $productsUrls);
		}
	}else{
		$doc = htmlToXpath($html->response);
	}

	//var_dump($productXpaths);

	//now we loop through all xpath we got to see witch one will match
	foreach ($productXpaths as $xpath){

		$search = searchXpath($doc, $xpath);

		//if this xpath pattern return something, then we can save it as the working one
		if($search->length > 0){

			//dirty hack to avoid passing too much arguments
			$productXpaths = array($xpath);

			//now we add all found urls to the array we'll return. Put them as key to avoid duplicates.
			foreach ($search as $key => $element) {
				$productsUrls[$element->value] = 1;
			}

			//as we've found the right pattern, no need to go check the others one
			continue 1;
		}
	}

	//now we check if we have enough product or if we should check some other pages
	$countProducts = count($productsUrls);
	if($countProducts !== 0 && $countProducts !== $previousCount && $countProducts < $maxPerCat){
		
		//we continue and go check on next page
		//increment page index we want
		$pageIndex++;

		//if we already added the page pattern, we need to remove it to get a new proper url
		if($pageIndex > 2){
			$url = substr($url, 0, -(strlen($pagePattern) - 2));
		}

		//create new url. Note rtrim, meaning your pagePattern must include the slash as 1st char
		$newUrl = str_replace('{i}', $pageIndex, rtrim($url, '/').$pagePattern);

		return getProductsUrl($pageIndex, $pagePattern, $newUrl, $productXpaths, $productsUrls, $countProducts, $maxPerCat);

	}else if($countProducts == $previousCount || $countProducts >= $maxPerCat){
		//then we're not adding any product, we can return too.
		//As we might have get TOO MUCH products, let's  slice it just to be sure
		$productsUrls = array_slice($productsUrls, 0, $maxPerCat, TRUE);
		return array('success' => $productsUrls);
	}else if($countProducts === 0){
		//We didn't find any products...
		return array('error' => 'We were not able to find products. Sorry.');
	}else{
		//this should not happen but who knows...
		//As we might have get TOO MUCH products, let's  slice it just to be sure
		$productsUrls = array_slice($productsUrls, 0, $maxPerCat, TRUE);
		return array('success' => $productsUrls);
	}
}

function getProduct($url, $system){

	$product = array('url' => $url);

	//scrap a product info
	$conf = $GLOBALS['CONF'][$system];
	$productConf = $conf['product'];

	$html = getHtml($url);

	//var_dump($html);

	if($html->http_status_code !== 200){
		return array('error' => $html->error_message);
	}else{
		$doc = htmlToXpath($html->response);
	}

	foreach ($productConf as $key => $productXpaths) {
		if(!$productXpaths){
			continue;
		}

		$product[$key] = null;

		//That whole block is not very efficient cause we don't remember which Xpath from previous product but thats tradeoff for dealing product 1 by 1
		foreach ($productXpaths as $xpath){
			$search = searchXpath($doc, $xpath);

			foreach ($search as $node) {

				if($key === 'description'){
					$product[$key] .= trim($node->nodeValue);
				}else if($key === 'price'){

					$match = preg_match('/(\d{1,}\.?\d{0,})/', $node->nodeValue, $matches);
					if($match > 0){
						$product['price'] = (float)$matches[1];
					}

				}else{
					if(empty(trim($node->nodeValue)) === false){
						$product[$key] = $node->nodeValue;
						continue 2;
					}
				}
			} // end foreach 
			
		}

	}

	return $product;
}

function wooProcessChildren($line, &$output, $url){
	//Explode woo xml categories
	$split = explode('/', $line, 2);

	if(!isset($output[$split[0]]) && $split[0] != '')
	    $output[$split[0]] = array('url' => $url);

	if(isset($split[1]))
	   wooProcessChildren($split[1], $output[$split[0]], $url);
}

function checkSystem($url){

	//find which CMS the site we're gonna work on is running
	/*
		Only detect Woocommerce for now
	*/

	$html = getHtml($url);

	if($html->http_status_code !== 200){
		return array('error' => $html->error_message);
	}else{
		$doc = htmlToXpath($html->response);
	}

	foreach ($GLOBALS['CONF'] as $system => $conf){
		foreach($conf['detect'] as $xpath){
			$search = searchXpath($doc, $xpath);
			
			if(isset($search->length) && $search->length > 0){
				return array('success' => $system);
			}
		}
	}

	//If we're here, we were not able to detect the system
	return array('error' => 'Sorry, we were not able to identify your CMS. Shoot us an email !');
}

function getHtml($url){

	if(preg_match('/^http/', $url) < 1){
		$url = 'http://'.$url;
	}

	$curl = new Curl\Curl();
	$curl->setOpt(CURLOPT_FOLLOWLOCATION, TRUE);
	$curl->setOpt(CURLOPT_HEADER, FALSE);
	$curl->setOpt(CURLOPT_USERAGENT, 'Algolia4ya crawler - http://pamart.in');
	$curl->get($url);

	//For some reason, some server don't 302 on 'www' and we need to add it manually
	if($curl->http_status_code === 404 && preg_match('/^http:\/\/www/', $url) < 1){
		//We need to remove the http we just added :-( :-( :-(
		$url = 'www.'.substr($url, 7);
		return getHtml($url);
	}

	//For some reason, some servers send the head tag into headers...
	if($curl->http_status_code === 200 && is_array($curl->response_headers)){
		$curl->response = implode(' ', $curl->response_headers) . $curl->response;
	}

	return $curl;
}

function htmlToXpath($html){
	$doc = new DOMDocument();
	libxml_use_internal_errors(true);
	$doc->loadHTML($html);

	return new DOMXpath($doc);
}

function searchXpath($doc, $xpath){
	return $doc->evaluate($xpath);
}

function returnJSON($arr){
	return json_encode($arr);
}

exit;
