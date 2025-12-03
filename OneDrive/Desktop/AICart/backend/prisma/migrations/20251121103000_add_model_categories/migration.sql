-- AlterTable
ALTER TABLE `ai_models` MODIFY `user_id` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `assets` MODIFY `user_id` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `model_categories` (
    `id` VARCHAR(36) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `category_group` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `model_categories_slug_key`(`slug`),
    INDEX `model_categories_scope_category_group_idx`(`scope`, `category_group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_category_links` (
    `id` VARCHAR(36) NOT NULL,
    `model_id` VARCHAR(36) NOT NULL,
    `category_id` VARCHAR(36) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `model_category_links_model_id_category_id_key`(`model_id`, `category_id`),
    INDEX `model_category_links_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `model_category_links` ADD CONSTRAINT `model_category_links_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_category_links` ADD CONSTRAINT `model_category_links_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `model_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

