<?php

namespace SlicedUpload;

abstract class Helper
{
    public static function ok(array $response = [])
    {
        http_response_code(200);
        echo json_encode($response);

        exit(0);
    }

    public static function error($message)
    {
        http_response_code(400);

        echo json_encode([
            'error' => $message
        ]);

        file_put_contents(__DIR__ . '/../error.log', "{$message}\n", FILE_APPEND);

        exit(1);
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