<?php

namespace SlicedUpload\SlicedUpload;

use SlicedUpload\Helper;

class Upload
{
    public static $datastore = null;

    public $identifier;
    public $fileHash;
    public $chunkCount;
    public $fileName;
    public $fileSize;
    public $fileType;
    public $tempFile;
    public $nonce;
    public $lastChunk;

    public function __construct($identifier, $fileHash, $tempFile, $chunkCount, $fileName, $fileSize, $fileType, $nonce, $lastChunk)
    {
        if (null === static::$datastore) {

            throw new \Exception('Datastore not set');

        }

        $this->identifier = $identifier;
        $this->fileHash = $fileHash;
        $this->tempFile = $tempFile;
        $this->chunkCount = $chunkCount;
        $this->fileName = $fileName;
        $this->fileSize = $fileSize;
        $this->fileType = $fileType;
        $this->nonce = $nonce;
        $this->lastChunk = $lastChunk;
    }

    public static function create($hash, $chunkCount, $fileName, $fileSize, $fileType)
    {
        $instance = new static(
            Helper::uuid(),
            $hash,
            Helper::getTempFile(),
            $chunkCount,
            $fileName,
            $fileSize,
            $fileType,
            Helper::uuid(),
            -1
        );

        if (!$instance->save()) {

            @unlink($instance->tempFile);

            throw new \Exception('Failed to create upload');

        }

        return $instance;
    }

    public static function find($identifier, $nonce)
    {
        $row = static::$datastore->findByKeys(
            '__uploads',
            [
                'uuid' => $identifier,
                'nonce' => $nonce
            ]
        );

        return new static(
            $row['uuid'],
            $row['file_hash'],
            $row['temp_file'],
            $row['chunk_count'],
            $row['file_name'],
            $row['file_size'],
            $row['file_type'],
            $row['nonce'],
            $row['last_chunk']
        );
    }

    protected function save()
    {
        return static::$datastore->insertOrUpdate(
            '__uploads',
            [
                'uuid'          => $this->identifier,
                'temp_file'     => $this->tempFile,
                'file_hash'     => $this->fileHash,
                'chunk_count'   => $this->chunkCount,
                'file_name'     => $this->fileName,
                'file_size'     => $this->fileSize,
                'file_type'     => $this->fileType,
                'nonce'         => $this->nonce,
                'last_chunk'    => $this->lastChunk,
            ],
            [
                'uuid' => $this->identifier
            ]
        );
    }

    public function verifyChunk(Chunk $chunk)
    {
        if (intval($chunk->index) !== intval($this->lastChunk + 1)) {

            return false;

        }

        if ($chunk->identifier !== $this->identifier) {

            return false;

        }

        return $chunk->verify();
    }

    public function append(Chunk $chunk)
    {
        file_put_contents(
            $this->tempFile,
            file_get_contents($chunk->chunk),
            FILE_APPEND
        );

        $this->lastChunk = $chunk->index;
        $this->nonce = Helper::uuid();

        if (!$this->save()) {

            throw new \Exception('Failed to save upload');

        }

        return true;
    }

    public function store($filename)
    {
        if (!rename($this->tempFile, $filename)) {

            throw new \Exception('Failed to store upload');

        }

        $localHash = hash_file('sha256', $filename);

        if ($localHash !== $this->fileHash) {

            throw new \Exception('Failed to verify upload');

        }

        static::$datastore->delete(
            '__uploads',
            [
                'uuid' => $this->identifier
            ]
        );

        return true;
    }
}