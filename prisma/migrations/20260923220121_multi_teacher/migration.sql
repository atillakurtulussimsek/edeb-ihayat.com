-- AlterTable
ALTER TABLE `User` ADD COLUMN `teacherId` VARCHAR(191) NULL;
ALTER TABLE `Lesson` ADD COLUMN `teacherId` VARCHAR(191) NULL;

-- Backfill: mevcut öğrenci ve dersleri ilk öğretmene bağla
UPDATE `User` u
JOIN (SELECT `id` FROM `User` WHERE `role` = 'TEACHER' ORDER BY `createdAt` LIMIT 1) t
SET u.`teacherId` = t.`id`
WHERE u.`role` = 'STUDENT';

UPDATE `Lesson` l
JOIN (SELECT `id` FROM `User` WHERE `role` = 'TEACHER' ORDER BY `createdAt` LIMIT 1) t
SET l.`teacherId` = t.`id`;

ALTER TABLE `Lesson` MODIFY `teacherId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `User_teacherId_idx` ON `User`(`teacherId`);
CREATE INDEX `Lesson_teacherId_idx` ON `Lesson`(`teacherId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
