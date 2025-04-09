<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, HEAD, OPTIONS, PATCH, DELETE");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/php/vendor/autoload.php';

if (function_exists('request_parse_body')) {
    // Use request_parse_body if PHP 8.4+
    if (in_array($_SERVER['REQUEST_METHOD'], ['PATCH', 'PUT', 'DELETE'])) {
        [$_POST, $_FILES] = request_parse_body();
    }
} else {
    // Use _method to override request method
    if (isset($_POST['_method']) && in_array($_POST['_method'], ['PATCH', 'PUT', 'DELETE'])) {
        $_SERVER['REQUEST_METHOD'] = $_POST['_method'];
    }
}

$datastore = new \SlicedUpload\Datastore\Mysql(
    new \PDO(
        'mysql:host=localhost;dbname=t',
        'root',
        ''
    )
);

\SlicedUpload\SlicedUpload::process(
    function ($tempFile) {
        @unlink(__DIR__ . '/test.mp4');
        rename($tempFile, __DIR__ . '/test.mp4');
    },
    $datastore
);
