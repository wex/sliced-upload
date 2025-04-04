<?php

namespace SlicedUpload\Datastore;

use SlicedUpload\Datastore;

class Mysql extends Datastore
{
    private $pdo;

    protected function _kvpToWhere(array $keysAndValues)
    {
        return array_map(
            function ($value, $key) {
                return sprintf(
                    '`%s` = %s',
                    $key,
                    $this->pdo->quote($value, \PDO::PARAM_STR)
                );
            },
            $keysAndValues,
            array_keys($keysAndValues)
        );
    }

    protected function _kvpToFields(array $keysAndValues)
    {
        return array_map(
            function ($key) {
                return sprintf(
                    '`%s`',
                    $key
                );
            },
            array_keys($keysAndValues)
        );
    }

    protected function _kvpToValues(array $keysAndValues)
    {
        return array_map(
            function ($value) {
                return sprintf(
                    '%s',
                    (null === $value) ? 'NULL' : $this->pdo->quote($value, \PDO::PARAM_STR)
                );
            },
            $keysAndValues
        );
    }

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByKeys($table, array $keysAndValues): array
    {
        $sql = sprintf(
            'SELECT * FROM `%s` WHERE %s LIMIT 1',
            $table,
            implode(
                ' AND ',
                $this->_kvpToWhere($keysAndValues)
            )
        );

        foreach ($this->pdo->query($sql) as $row) {

            return $row;

        }

        throw new \Exception('No record found');
    }

    public function insert($table, array $data)
    {
        $sql = sprintf(
            'INSERT INTO `%s` (%s) VALUES (%s)',
            $table,
            implode(', ', $this->_kvpToFields($data)),
            implode(', ', $this->_kvpToValues($data))
        );

        return $this->pdo->exec($sql);
    }

    public function replace($table, array $data)
    {
        $sql = sprintf(
            'REPLACE INTO `%s` (%s) VALUES (%s)',
            $table,
            implode(', ', $this->_kvpToFields($data)),
            implode(', ', $this->_kvpToValues($data))
        );

        return $this->pdo->exec($sql);
    }

    public function update($table, array $data, array $keysAndValues)
    {
        $sql = sprintf(
            'UPDATE `%s` SET %s WHERE %s',
            $table,
            implode(', ', $this->_kvpToWhere($data)),
            implode(', ', $this->_kvpToWhere($keysAndValues))
        );

        return $this->pdo->exec($sql);
    }

    public function delete($table, array $keysAndValues)
    {
        $sql = sprintf(
            'DELETE FROM `%s` WHERE %s',
            $table,
            implode(', ', $this->_kvpToWhere($keysAndValues))
        );

        return $this->pdo->exec($sql);
    }

    public function insertOrUpdate($table, array $data, array $keysAndValues)
    {
        try {

            $row = $this->findByKeys($table, $keysAndValues);

            return $this->update($table, $data, ['id' => $row['id']]);

        } catch (\Exception $e) {

            return $this->insert($table, $data);

        }
    }
}