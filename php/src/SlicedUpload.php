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

        if (isset($_FILES['chunk']) && $_FILES['chunk']) {

            $instance->readChunk();

        } else {

            $instance->readHandshake();

        }
    }

    protected function readChunk()
    {
        try {

            $uploadHash = Request::post('sliced_upload');
            $chunkIndex = Request::post('index');
            $nonce = Request::post('nonce');
            $chunk = Request::file('chunk');

            // Create chunk
            $chunk = Chunk::create(
                $uploadHash,
                $chunkIndex,
                $chunk
            );
            
            // Find upload
            $upload = Upload::find($uploadHash, $nonce);

            // Verify chunk
            if (!$upload->verifyChunk($chunk)) {

                throw new \Exception('Invalid chunk');

            }

            // Append chunk to upload
            $upload->append($chunk);

            // If last chunk, save upload
            if (intval($chunkIndex) === intval($upload->chunkCount - 1)) {

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

            $fileHash = Request::post('sliced_upload');
            $chunkCount = Request::post('chunks');
            $fileName = Request::post('filename');
            $fileSize = Request::post('filesize');
            $fileType = Request::post('filetype');

            // Create upload
            $upload = Upload::create(
                $fileHash, 
                $chunkCount, 
                $fileName, 
                $fileSize, 
                $fileType
            );

            // ACK with upload UUID and nonce
            return Helper::ok(['uuid' => $upload->identifier, 'nonce' => $upload->nonce]);

        } catch (\Exception $e) {

            return Helper::error($e->getMessage());

        }
    }
}
