<?php

namespace SlicedUpload;

abstract class Request
{
    public static function method()
    {
        return strtoupper($_SERVER['REQUEST_METHOD']);
    }

    public static function post($key, $required = true, $default = null)
    {
        if (!isset($_POST[$key])) {

            if ($required) {
                throw new \Exception("Invalid request: missing {$key}");
            }

            return $default;
        }

        return $_POST[$key];
    }

    public static function file($key)
    {
        if (!isset($_FILES[$key])) {

            throw new \Exception("Invalid request: missing {$key}");
        }

        switch ($_FILES[$key]['error']) {

            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_INI_SIZE:
                throw new \Exception("The uploaded file exceeds the upload_max_filesize directive in php.ini");
            case UPLOAD_ERR_FORM_SIZE:
                throw new \Exception("The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form");
            case UPLOAD_ERR_PARTIAL:
                throw new \Exception("The uploaded file was only partially uploaded");
            case UPLOAD_ERR_NO_FILE:
                throw new \Exception("No file was uploaded");
            case UPLOAD_ERR_NO_TMP_DIR:
                throw new \Exception("Missing a temporary folder");
            case UPLOAD_ERR_CANT_WRITE:
                throw new \Exception("Failed to write file to disk");
            case UPLOAD_ERR_EXTENSION:
                throw new \Exception("A PHP extension stopped the file upload");

            default:
                throw new \Exception("Unknown error: {$_FILES['key']['error']}");
        }

        if (!file_exists($_FILES[$key]['tmp_name'])) {

            throw new \Exception("File does not exist");

        }

        if (filesize($_FILES[$key]['tmp_name']) === 0) {

            throw new \Exception("File is empty");
        }

        if (filesize($_FILES[$key]['tmp_name']) <> $_FILES[$key]['size']) {

            throw new \Exception("File size mismatch");
        }

        return $_FILES[$key]['tmp_name'];
    }
}