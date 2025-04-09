<?php

namespace SlicedUpload;

use SlicedUpload\SlicedUpload\Chunk;
use SlicedUpload\SlicedUpload\Upload;

class SlicedUpload
{
    protected $fileHash;
    protected $chunkIndex;
    protected $chunkCount;

    protected $filenameOrCallback;

    public static function process($filenameOrCallback, Datastore $datastore)
    {
        Upload::$datastore = $datastore;
        
        $instance = new static();
        $instance->filenameOrCallback = $filenameOrCallback;

        if (is_string($filenameOrCallback)) {

            if (file_exists($filenameOrCallback)) {

                throw new \Exception('File already exists');

            } else {

                if (!file_exists(dirname($filenameOrCallback)) || !is_writable(dirname($filenameOrCallback))) {

                    throw new \Exception('Directory does not exist or is not writable');

                }

            }
        }

        switch (Request::method()) {
            case 'POST': return $instance->readHandshake();
            case 'PATCH': return $instance->readChunk();
            #case 'HEAD': return $instance->readStatus();
            #case 'DELETE': return $instance->readCancel();
            default: return Helper::error("Invalid method", 500);
        }
    }

    protected function readChunk()
    {
        try {

            Helper::buildRequest();

            print_r($_POST);
            print_r($_REQUEST);
            print_r($_PATCH);

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
            if (filesize($upload->tempFile) === $upload->fileSize) {

                if (is_callable($this->filenameOrCallback)) {

                    \Closure::fromCallable($this->filenameOrCallback)->call($this, $upload);

                } else {

                    $upload->store($this->filenameOrCallback);

                }

                return Helper::ok();

            } else {

                // Else send ACK with new nonce
                return Helper::ok(['nonce' => $upload->nonce]);

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
}
