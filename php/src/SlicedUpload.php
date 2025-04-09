<?php

namespace SlicedUpload;

use SlicedUpload\SlicedUpload\Chunk;
use SlicedUpload\SlicedUpload\Upload;

class SlicedUpload
{
    protected $fileHash;
    protected $chunkIndex;
    protected $chunkCount;

    protected $callback;

    public static function process(callable $callback, Datastore $datastore)
    {
        Upload::$datastore = $datastore;
        
        $instance = new static();
        $instance->callback = $callback;

        switch (Request::method()) {
            case 'POST': return $instance->readHandshake();
            case 'PATCH': return $instance->readChunk();
            case 'DELETE': return $instance->readCancel();
            #case 'HEAD': return $instance->readStatus();
            default: return Helper::error("Invalid method", 500);
        }
    }

    protected function readChunk()
    {
        try {

            $uuid = Request::post('uuid');
            $chunkHash = Request::post('checksum');
            $nonce = Request::post('nonce');
            $chunk = Request::file('chunk');

            // Create chunk
            $chunk = Chunk::create(
                $chunkHash,
                $chunk
            );

            // Verify chunk
            if (!$chunk->verify()) {

                throw new \Exception('Invalid chunk');

            }

            // Find upload
            $upload = Upload::find($uuid, $nonce);

            // Append chunk to upload
            $upload->append($chunk);

            // If last chunk, save upload

            if (filesize($upload->tempFile) < $upload->fileSize) {

                // If upload is not complete, send ACK with new nonce
                return Helper::ok([
                    'nonce' => $upload->nonce,
                    'size' => $chunk->size,
                ], 202);            

            } else {

                call_user_func($this->callback, $upload->tempFile);

                // If upload is not complete, send ACK with new nonce
                return Helper::ok([
                    'size' => $chunk->size,
                ], 200);   

            }
            
        } catch (\Exception $e) {

            return Helper::error($e->getMessage());
        }
    }

    protected function readHandshake()
    {
        try {

            $fileHash = Request::post('checksum');
            $fileName = Request::post('name');
            $fileSize = Request::post('size');
            $fileType = Request::post('type');

            // Create upload
            $upload = Upload::create(
                $fileHash, 
                $fileName, 
                $fileSize, 
                $fileType
            );

            // ACK with upload UUID and nonce
            return Helper::ok(['uuid' => $upload->uuid, 'nonce' => $upload->nonce, 'max_size' => Helper::getMaxSize()], 201);

        } catch (\Exception $e) {

            return Helper::error($e->getMessage());

        }
    }

    protected function readCancel()
    {
        try {

            $uuid = Request::post('uuid');
            $nonce = Request::post('nonce');

            // Find upload
            $upload = Upload::find($uuid, $nonce);
            
            // Delete upload
            $upload->destroy();

            // ACK
            return Helper::ok([], 200);

        } catch (\Exception $e) {

            return Helper::error($e->getMessage());

        }
    }
}
