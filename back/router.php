<?php
ini_set('xdebug.var_display_max_depth', 10);
ini_set('xdebug.var_display_max_children', 256);
ini_set('xdebug.var_display_max_data', 1024);

function __autoload($class_name){
    require(ucfirst($class_name) . '.class.php'); 
}

//Dirtiest rooter you've ever saw...but works :)
if(!empty($_GET)){
	switch ($_GET['action']) {
		case 'scrapper/checkSystem':
			//var_dump($_GET);
			$scrapper = new Scrapper($_GET['url']);
			$response = $scrapper->getSystem();
			exit($response);
		break;

		case 'scrapper/fetchCats':
			//var_dump($_GET);
			$system = $_GET['system'];
			$scrapper = new $system($system);
			$cats = $scrapper->fetchCats($_GET['url']);
			exit($cats);
		break;

		case 'scrapper/fetchCat':
			//var_dump($_GET);
			$system = $_GET['system'];
			$scrapper = new $system($system);
			$productsLinks = $scrapper->fetchCat($_GET['url'], (int)$_GET['maxPerCat']);
			exit($productsLinks);
		break;

		case 'scrapper/fetchProduct':
			//var_dump($_GET);
			$system = $_GET['system'];
			$scrapper = new $system($system);
			$product = $scrapper->getProduct($_GET['url']);
			exit($product);
		break;

		case 'algolia/getIndices':
			$algolia = new Algolia();
			$indices = $algolia->getIndices();
			exit($indices);
		break;

		case 'algolia/checkIndex':
			$algolia = new Algolia();
			$checkIndex = $algolia->checkIndex($_GET['indexName']);
			exit($checkIndex);
		break;

		default:
			exit(json_encode(array('error' => true)));
		break;
	}
}else if(!empty($_POST)){
	switch ($_POST['action']) {
		case 'algolia/createIndex':
			$algolia = new Algolia();
			$indexCreation = $algolia->createIndex($_POST['indexName'], json_decode($_POST['batch']));
			exit($indexCreation);
		break;
		case 'algolia/deleteIndex':
			$algolia = new Algolia();
			$indexDeletion = $algolia->deleteIndex($_POST['indexName']);
			exit($indexDeletion);
		break;
	}
}

exit;
