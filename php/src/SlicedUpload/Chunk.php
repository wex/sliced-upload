<?php

namespace SlicedUpload\SlicedUpload;

class Chunk
{
    public $hash;
    public $chunk;
    public $size;

    public function __construct($hash, $chunk)
    {
        $this->hash  = $hash;
        $this->chunk = $chunk;
        $this->size  = filesize($chunk);
    }

    public static function create($chunkHash, $chunk)
    {
        $instance = new static(
            $chunkHash,
            $chunk
        );

        return $instance;
    }

    public function verify()
    {
        if (!file_exists($this->chunk)) {

            return false;

        }

        if ($this->size === 0) {

            return false;

        }

        if ($this->hash !== hash_file('sha256', $this->chunk)) {

            return false;

        }
        
        return true;
    }
}