<?php

require_once('../libraries/curl/curl.php');

/**
* Scrapper Class - Contain all function needed to get the products. Parents ot specific CMS Class
*/
class Scrapper{

	private $system = false;
	private $globalConf = false;
	protected $conf = false;

	private $knownCMS = array(
		'woocommerce',
		'shopify'
	);
 
	function __construct($init){

		$this->globalConf = json_decode(file_get_contents('../config.json'), TRUE);

		if(in_array($init, $this->knownCMS)){
			$this->setSystem($init);
		}else{
			$this->checkSystem($init);
		}

		if($this->system){
			$this->setConf();
		}else{
			$this->sendError('The object need a system to work.');
		}
	}

	//Input an URL, output is to set $this->system
	private function checkSystem($url){

		$html = $this->getHtml($url);

		if($html->http_status_code !== 200){
			return $this->sendError($html->error_message);
		}else{
			$doc = $this->htmlToXpath($html->response);
		}

		foreach ($this->globalConf as $system => $conf){
			foreach($conf['detect'] as $xpath){
				$search = $this->searchXpath($doc, $xpath);
				
				if(isset($search->length) && $search->length > 0){
					return $this->system = $system;
				}
			}
		}

		//If we're here, we were not able to detect the system
		return $this->sendError('Sorry, we were not able to identify your CMS. Shoot us an email !');
	}

	//Input an url and a MAx Per CAt, Output an array of results
	public function fetchCat($url, $maxPerCat){

		$productXpaths = $this->conf['products']['product'];
		$pagePattern = $this->conf['products']['paging'];
		$pageIndex = 1;

		$workingProductXpath = false;
		$productsUrls = array();

		$results = $this->getProductsUrl($pageIndex, $pagePattern, $url, $productXpaths, $productsUrls, count($productsUrls), $maxPerCat);

		if(array_key_exists('success', $results)){
			return $this->sendSuccess($results['success']);
		}else{
			return $this->sendError($results['error']);
		}

	}

	/*
	Recursive
	Inputs :
		pageIndex -> number of the page to get
		pagePattern -> Pattern to create url to get page number $pageIndex
		url -> url to apply the paging system
		productXpath -> Xpath to detect the product page url
		productsUrls -> array containing already got products's url
		previousCount -> this is used to be sure not to send too much urls
		maxPerCat -> the max number of urls we'll output


	Outputs :
		An array of products URLS

	*/
	private function getProductsUrl($pageIndex, $pagePattern, $url, $productXpaths, $productsUrls, $previousCount, $maxPerCat){

		$html = $this->getHtml($url);

		if($html->http_status_code !== 200){
			if(count($productsUrls) === 0){
				return array('error' => $html->error_message);
			}else{
				return array('success' => $productsUrls);
			}
		}else{
			$doc = $this->htmlToXpath($html->response);
		}

		//var_dump($productXpaths);

		//now we loop through all xpath we got to see witch one will match
		foreach ($productXpaths as $xpath){

			$search = $this->searchXpath($doc, $xpath);

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

			return $this->getProductsUrl($pageIndex, $pagePattern, $newUrl, $productXpaths, $productsUrls, $countProducts, $maxPerCat);

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

	//Input an url, output a Product array
	public function getProduct($url){

		$product = array('url' => $url);

		//scrap a product info
		$productConf = $this->conf['product'];

		$html = $this->getHtml($url);

		//var_dump($html);

		if($html->http_status_code !== 200){
			return $this->sendError($html->error_message);
		}else{
			$doc = $this->htmlToXpath($html->response);
		}

		foreach ($productConf as $key => $productXpaths) {
			if(!$productXpaths){
				continue;
			}

			$product[$key] = null;

			//That whole block is not very efficient cause we don't remember which Xpath from previous product but thats tradeoff for dealing product 1 by 1
			foreach ($productXpaths as $xpath){
				$search = $this->searchXpath($doc, $xpath);

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

		return $this->sendSuccess($product);
	}

	//Set $this->system
	private function setSystem($system){
		return $this->system = $system;
	}

	//Get system
	public function getSystem(){
		if($this->system){
			return $this->sendSuccess($this->system);
		}else{
			return $this->sendError('The system was not identified.');
		}
	}

	//Set $this->conf
	private function setConf(){
		$this->conf = $this->globalConf[$this->system];
	}

	//Return an error
	protected function sendError($msg){
		return $this->returnJSON(array('error' => $msg));
	}

	//Return a success
	protected function sendSuccess($obj){
		return $this->returnJSON(array('success' => $obj));
	}

	//Input a url to output a Curl Object
	protected function getHtml($url){

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
			return $this->getHtml($url);
		}

		//For some reason, some servers send the head tag into headers...
		if($curl->http_status_code === 200 && is_array($curl->response_headers)){
			$curl->response = implode(' ', $curl->response_headers) . $curl->response;
		}

		return $curl;
	}

	//Input an $html string to output a DOM Object Xpath compliant
	protected function htmlToXpath($html){
		$doc = new DOMDocument();
		libxml_use_internal_errors(true);
		$doc->loadHTML($html);

		return new DOMXpath($doc);
	}

	//Input a DOM Object + Xpath string, output DOM Childs
	protected function searchXpath($doc, $xpath){
		return $doc->evaluate($xpath);
	}

	//Input an array, output a json string
	private function returnJSON($arr){
		return json_encode($arr);
	}
}
