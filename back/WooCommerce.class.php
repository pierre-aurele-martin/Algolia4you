<?php
/**
* Child Woocommerce, extends Scrapper
*/

class WooCommerce extends Scrapper {
	
	//Input Url, output an array of available Categories
	public function fetchCats($url){

		$catUrl = $url . $this->conf['categories']['url'];
		
		$regex = '/'.$url.'\/(.*)/';
		$content = $this->getHtml($catUrl);

		$xml = new SimpleXMLElement($content->response);

		$cats = array();
		
		foreach ($xml as $url){

			$str = $url->loc;
			preg_match_all($regex, $str, $matches, PREG_SET_ORDER, 0);

			$catRoot = str_replace('product-category/', '', $matches[0][1]);
			$this->wooProcessChildren($catRoot, $cats, (string)$str);
			
		}

		return $this->sendSuccess(array('cats' => $cats));
	}

	private function wooProcessChildren($line, &$output, $url){
		//Explode woo xml categories
		$split = explode('/', $line, 2);

		if(!isset($output[$split[0]]) && $split[0] != '')
		    $output[$split[0]] = array('url' => $url);

		if(isset($split[1]))
		   $this->wooProcessChildren($split[1], $output[$split[0]], $url);
	}
}
