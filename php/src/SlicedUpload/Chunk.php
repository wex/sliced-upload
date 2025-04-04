<?php

namespace SlicedUpload\SlicedUpload;

class Chunk
{
    public $identifier;
    public $index;
    public $chunk;

    public function __construct($identifier, $index, $chunk)
    {
        $this->identifier = $identifier;
        $this->index = $index;
        $this->chunk = $chunk;
    }

    public static function create($uploadHash, $chunkIndex, $chunk)
    {
        $instance = new static(
            $uploadHash,
            $chunkIndex,
            $chunk
        );

        return $instance;
    }

    public function verify()
    {
        if (!file_exists($this->chunk)) {

            return false;

        }

        if (!filesize($this->chunk)) {

            return false;

        }
        
        return true;
    }
}