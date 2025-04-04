<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");

require_once __DIR__ . '/php/vendor/autoload.php';

$datastore = new \SlicedUpload\Datastore\Mysql(
    new \PDO(
        'mysql:host=localhost;dbname=t',
        'root',
        ''
    )
);

\SlicedUpload\SlicedUpload::process(
    __DIR__ . '/test.mp4',
    $datastore
);
