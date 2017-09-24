<?php

require_once('secret_key.php'); 
require_once('../libraries/algoliasearch-client-php-master/algoliasearch.php');

/**
* Algolia Class - Everything we need to deal with Algolia through PHP API
*/
class Algolia{

	private $APP_ID = '653YPGRUJS';
	private $DEFAULT_INDEX = 'default_Index';
	private $OBJECTS_LIMIT = (10 * 1000);

	private $client = false;
	private $indices = false;

	function __construct(){

		$this->client = new \AlgoliaSearch\Client($this->APP_ID, $GLOBALS['MASTER_KEY']);

		$indices = $this->client->listIndexes();

		if($indices){
			foreach ($indices['items'] as $key => &$index) {
				if($index['name'] === $this->DEFAULT_INDEX){
					unset($indices['items'][$key]);
					continue;
				}

				$systemAbr = substr($index['name'], 0,2);
				$index['realName'] = substr($index['name'], 3);
				switch ($systemAbr) {
					case 'WC':
						$index['system'] = 'woocommerce';
					break;
					
					default:
						//should never happen as we can create index without knowing system
						$index['system'] = false;
					break;
				}
				
			}
			
			$this->indices =  $indices;
		}
	}

	public function getIndices(){

		if($this->indices){
			return $this->sendSuccess($indices);
		}else{
			return $this->sendError('We we\'re not able to fetch our Algolia index.');
		}
	}

	public function checkIndex($indexName){
		
		foreach ($this->indices['items'] as $key => $index) {
			if($index['name'] === $indexName){
				return $this->sendSuccess(true);
			}
		}

		return $this->sendSuccess(false);
	}

	public function deleteIndex($indexName){

		//Under no circumstances we delete DEFAULT_INDEX;
		if($indexName === $this->DEFAULT_INDEX){
			return $this->sendError('You can not delete the default index.');
		}

		return $this->sendSuccess($this->client->deleteIndex($indexName));
	}

	public function createIndex($indexName, $batch){

		/*
		As I'm lazy, I'll just copy the default index in order to create one.
		That allow me to manage All settings from this default.
		*/

		//Do we need to make room for this new index ? 
		$cntObjects = cntObjects($this->indices);

		if($this->makeRoom(count($batch))){

			//we create the index
			$res = $this->client->copyIndex($this->DEFAULT_INDEX, $indexName);

			if($res){
				//set the index
				$index = $this->client->initIndex($indexName);

				//send the object
				$res1 = $index->addObjects($batch);

				if($res1){
					return $this->sendSuccess(true);
				}else{
					return $this->sendError('We were not able to add the objects to the index. Sorry.');
				}
			}else{
				return $this->sendError('We were not able to create a new index. Sorry.');
			}

		}else{
			return $this->sendError('We were not able to make enough place for this index.');
		}
	}

	private function cntObjects($indices){

		$cntObjects = 0;

		foreach ($indices['items'] as $key => $index){
			$cntObjects += $index['entries'];
		}

		return $cntObjects;
	}

	private function getOldestIndex($indices){

		$DT = DateTime::createFromFormat("Y-m-d\TH:i:s.uO", date("Y-m-d\TH:i:s.uO"));
		$oldest = null;

		foreach ($indices['items'] as $key => $index){

			$dateTime = DateTime::createFromFormat("Y-m-d\TH:i:s.uO", $index['updatedAt']);

			if($dateTime <= $DT){
				$DT = $dateTime;
				$oldest = $key;
			}

		}

		return $oldest;
	}

	private function deleteAllIndices(){
		//Only for debug purpose
		foreach ($this->indices['items'] as $key => $index) {
			deleteIndex($this->client, $index['name']);
		}
		return true;
	}

	private function makeRoom($length){

		if(cntObjects($this->indices) >= ($this->OBJECTS_LIMIT - $length)){
			//get the oldest index
			$oldestIndex = $this->getOldestIndex($this->indices);

			//delete it
			deleteIndex($this->indices['items'][$oldestIndex]['name']);

			$roomMade = $this->indices['items'][$oldestIndex]['entries'];
			unset($this->indices['items'][$oldestIndex]);

			//was that enough ?
			if($roomMade >= $length){
				return true;
			}else{
				//we need to delete another index
				return $this->makeRoom(($length - $roomMade));
			}

		}else{
			//no need to make room, there is enough !
			return true;
		}
	}

	//Input something, return JSON String
	private function returnJSON($arr){
		return json_encode($arr);
	}

	//Return an error
	private function sendError($msg){
		return $this->returnJSON(array('error' => $msg));
	}

	//Return a success
	private function sendSuccess($obj){
		return $this->returnJSON(array('success' => $obj));
	}

}