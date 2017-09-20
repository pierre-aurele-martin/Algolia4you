<?php

/*
TODO : 

*/


$GLOBALS['APP_ID'] = '653YPGRUJS';
$GLOBALS['MASTER_KEY'] = 'ca8e72108f87bf47956857a698991d42';
$GLOBALS['DEFAULT_INDEX'] = 'default_Index';
$GLOBALS['OBJECTS_LIMIT'] = (10 * 1000);

require_once('../libraries/algoliasearch-client-php-master/algoliasearch.php');
$client = new \AlgoliaSearch\Client($GLOBALS['APP_ID'], $GLOBALS['MASTER_KEY']);

//Dirtiest rooter you've ever saw...but works :)
if(!empty($_GET)){
	switch ($_GET['action']) {
		case 'getIndices':
			exit(returnJSON(getIndices($client)));
		break;
		case 'checkIndex':
			exit(returnJSON(checkIndex(getIndices($client), $_GET['indexName'])));
		break;
	}
}else if(!empty($_POST)){
	switch ($_POST['action']) {
		case 'createIndex':
			exit(returnJSON(createIndex($client, $_POST['indexName'], json_decode($_POST['batch']))));
		break;
	}
}

function getIndices($client){
	$indices = $client->listIndexes();

	foreach ($indices['items'] as $key => &$index) {
		if($index['name'] === $GLOBALS['DEFAULT_INDEX']){
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
	
	return $indices;
}

function checkIndex($indices, $indexName){
	
	foreach ($indices['items'] as $key => $index) {
		if($index['name'] === $indexName){
			return true;
		}
	}

	return false;
}

function cntObjects($indices){

	$cntObjects = 0;

	foreach ($indices['items'] as $key => $index){
		$cntObjects += $index['entries'];
	}

	return $cntObjects;
}

function getOldestIndex($indices){

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

function deleteIndex($client, $indexName){

	//Under no circumstances we delete DEFAULT_INDEX;
	if($indexName === $GLOBALS['DEFAULT_INDEX']){
		return false;
	}

	return $client->deleteIndex($indexName);
}

function makeRoom($client, $indices, $length){

	if(cntObjects($indices) >= ($GLOBALS['OBJECTS_LIMIT'] - $length)){
		//get the oldest index
		$oldestIndex = getOldestIndex($indices);

		//delete it
		deleteIndex($client, $indices['items'][$oldestIndex]['name']);

		$roomMade = $indices['items'][$oldestIndex]['entries'];
		unset($indices['items'][$oldestIndex]);

		//was that enough ?
		if($roomMade >= $length){
			return true;
		}else{
			//we need to delete another index
			return makeRoom($client, getIndices($client), ($length - $roomMade));
		}

	}else{
		//no need to make room, there is enough !
		return true;
	}
}

function createIndex($client, $indexName, $batch){

	/*
	As I'm lazy, I'll just copy the default index in order to create one.
	That allow me to manage All settings from this default.
	*/

	//Do we need to make room for this new index ? 
	$indices = getIndices($client);
	$cntObjects = cntObjects($indices);

	if(makeRoom($client, $indices, count($batch))){

		//we create the index
		$res = $client->copyIndex($GLOBALS['DEFAULT_INDEX'], $indexName);

		if($res){
			//set the index
			$index = $client->initIndex($indexName);

			//send the object
			$res1 = $index->addObjects($batch);

			if($res1){
				return true;
			}else{
				return array('error' => 'We were not able to add the objects to the index. Sorry.');
			}
		}else{
			return array('error' => 'We were not able to create a new index. Sorry.');
		}

	}else{
		return array('error' => 'We were not able to make enough place for this index.');
	}
}


function returnJSON($arr){
	return json_encode($arr);
}

exit;