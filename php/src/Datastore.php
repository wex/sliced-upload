<?php

namespace SlicedUpload;

abstract class Datastore
{
    abstract public function findByKeys($table, array $keysAndValues);
    abstract public function insert($table, array $data);
    abstract public function replace($table, array $data);
    abstract public function update($table, array $data, array $keysAndValues);
    abstract public function delete($table, array $keysAndValues);
    abstract public function insertOrUpdate($table, array $data, array $keysAndValues);
}