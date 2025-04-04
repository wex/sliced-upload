CREATE TABLE `__uploads` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`uuid` VARCHAR(40) NOT NULL COLLATE 'utf8mb4_general_ci',
	`temp_file` VARCHAR(200) NOT NULL COLLATE 'utf8mb4_general_ci',
	`file_hash` VARCHAR(100) NOT NULL COLLATE 'utf8mb4_general_ci',
	`chunk_count` INT(11) NOT NULL,
	`file_name` VARCHAR(200) NOT NULL COLLATE 'utf8mb4_general_ci',
	`file_size` INT(11) NOT NULL,
	`file_type` VARCHAR(40) NOT NULL COLLATE 'utf8mb4_general_ci',
	`nonce` VARCHAR(40) NOT NULL COLLATE 'utf8mb4_general_ci',
	`last_chunk` INT(11) NOT NULL DEFAULT '0',
	`created_at` TIMESTAMP NULL DEFAULT current_timestamp(),
	PRIMARY KEY (`id`) USING BTREE,
	UNIQUE INDEX `identifier` (`uuid`) USING BTREE,
	INDEX `file_hash` (`file_hash`) USING BTREE,
	INDEX `created_at` (`created_at`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB;
