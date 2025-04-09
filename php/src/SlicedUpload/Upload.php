<?php

namespace SlicedUpload\SlicedUpload;

use SlicedUpload\Helper;

class Upload
{
    public static $datastore = null;

    public $uuid;
    public $fileHash;
    public $fileName;
    public $fileSize;
    public $fileType;
    public $tempFile;
    public $nonce;

    public function __construct($uuid, $fileHash, $tempFile, $fileName, $fileSize, $fileType, $nonce)
    {
        if (null === static::$datastore) {

            throw new \Exception('Datastore not set');

        }

        $this->uuid     = $uuid;
        $this->fileHash = $fileHash;
        $this->tempFile = $tempFile;
        $this->fileName = $fileName;
        $this->fileSize = $fileSize;
        $this->fileType = $fileType;
        $this->nonce    = $nonce;
    }

    public static function create($fileHash, $fileName, $fileSize, $fileType)
    {
        $instance = new static(
            Helper::uuid(),
            $fileHash,
            Helper::getTempFile(),
            $fileName,
            $fileSize,
            $fileType,
            Helper::uuid(),
        );

        if (!$instance->save()) {

            @unlink($instance->tempFile);

            throw new \Exception('Failed to create upload');

        }

        return $instance;
    }

    public static function fetch($uuid)
    {
        $row = static::$datastore->findByKeys(
            '__uploads',
            ['uuid' => $uuid]
        );

        if (empty($row)) {

            throw new \Exception('Upload not found');

        }

        return new static(
            $row['uuid'],
            $row['file_hash'],
            $row['temp_file'],
            $row['file_name'],
            $row['file_size'],
            $row['file_type'],
            $row['nonce']
        );
    }

    public static function find($uuid, $nonce)
    {
        $row = static::$datastore->findByKeys(
            '__uploads',
            [
                'uuid' => $uuid,
                'nonce' => $nonce
            ]
        );

        if (empty($row)) {

            throw new \Exception('Upload not found');

        }

        return new static(
            $row['uuid'],
            $row['file_hash'],
            $row['temp_file'],
            $row['file_name'],
            $row['file_size'],
            $row['file_type'],
            $row['nonce']
        );
    }

    protected function save()
    {
        return static::$datastore->insertOrUpdate(
            '__uploads',
            [
                'uuid'          => $this->uuid,
                'temp_file'     => $this->tempFile,
                'file_hash'     => $this->fileHash,
                'file_name'     => $this->fileName,
                'file_size'     => $this->fileSize,
                'file_type'     => $this->fileType,
                'nonce'         => $this->nonce,
            ],
            [
                'uuid' => $this->uuid
            ]
        );
    }

    public function verifyChunk(Chunk $chunk)
    {
        return $chunk->verify();
    }

    public function append(Chunk $chunk)
    {
        file_put_contents(
            $this->tempFile,
            file_get_contents($chunk->chunk),
            FILE_APPEND
        );

        @unlink($chunk->chunk);

        $this->nonce = Helper::uuid();

        if (!$this->save()) {

            throw new \Exception('Failed to save upload');

        }

        return true;
    }

    public function destroy()
    {
        static::$datastore->delete(
            '__uploads',
            [
                'uuid' => $this->uuid
            ]
        );
     
        if (file_exists($this->tempFile)) {

            unlink($this->tempFile);

        }

        return true;
    }
}