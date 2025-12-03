-- DropForeignKey
ALTER TABLE `ai_models` DROP FOREIGN KEY `ai_models_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `assets` DROP FOREIGN KEY `assets_user_id_fkey`;

-- AlterTable
ALTER TABLE `assets` MODIFY `url` LONGTEXT NOT NULL;

-- CreateTable
CREATE TABLE `library_categories` (
    `id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `bg_color` VARCHAR(191) NULL,
    `accent_color` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `library_categories_type_name_key`(`type`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_models` ADD CONSTRAINT `ai_models_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
