-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `phone` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('INDIVIDUAL', 'GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    `status` ENUM('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `startsAt` DATETIME(3) NOT NULL,
    `durationMin` INTEGER NOT NULL DEFAULT 60,
    `meetingId` VARCHAR(191) NOT NULL,
    `attendeePw` VARCHAR(191) NOT NULL,
    `moderatorPw` VARCHAR(191) NOT NULL,
    `record` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Lesson_meetingId_key`(`meetingId`),
    INDEX `Lesson_startsAt_idx`(`startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonStudent` (
    `lessonId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NULL,

    PRIMARY KEY (`lessonId`, `studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LessonStudent` ADD CONSTRAINT `LessonStudent_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonStudent` ADD CONSTRAINT `LessonStudent_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
