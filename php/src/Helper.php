<?php

namespace SlicedUpload;

abstract class Helper
{
    public static function buildRequest()
    {
        global $_PATCH;

        $_PATCH = [];
        parse_str(file_get_contents('php://input'), $_PATCH);
    }

    public static function ok(array $response = [], $code = 200)
    {
        http_response_code($code);
        echo json_encode($response);

        exit(0);
    }

    public static function error($message, $code = 400)
    {
        http_response_code($code);

        echo json_encode([
            'error' => $message
        ]);

        exit(1);
    }

    public static function getMaxSize()
    {
        $maxSize = ini_get('upload_max_filesize');

        if (!is_numeric($maxSize)) {

            return 1024 * 1024 * 1;

        }

        return $maxSize;
    }

    public static function getTempDir()
    {
        return ini_get('upload_tmp_dir') ?: sys_get_temp_dir();
    }

    public static function getTempFile()
    {
        return tempnam(self::getTempDir(), 'sliced-upload');
    }

    public static function uuid()
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}