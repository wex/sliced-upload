<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
