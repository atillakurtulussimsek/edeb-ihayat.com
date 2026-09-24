-- CreateTable
CREATE TABLE `LessonStats` (
    `lessonId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'poll',
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `durationSec` INTEGER NOT NULL DEFAULT 0,
    `participantCount` INTEGER NOT NULL DEFAULT 0,
    `totalMessages` INTEGER NOT NULL DEFAULT 0,
    `totalTalkSec` INTEGER NOT NULL DEFAULT 0,
    `pollCount` INTEGER NOT NULL DEFAULT 0,
    `raw` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`lessonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `externalUserId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `moderator` BOOLEAN NOT NULL DEFAULT false,
    `joinedAt` DATETIME(3) NOT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL,
    `leftAt` DATETIME(3) NULL,
    `durationSec` INTEGER NOT NULL DEFAULT 0,
    `talkTimeSec` INTEGER NOT NULL DEFAULT 0,
    `webcamTimeSec` INTEGER NOT NULL DEFAULT 0,
    `messages` INTEGER NOT NULL DEFAULT 0,
    `raisedHands` INTEGER NOT NULL DEFAULT 0,
    `emojis` INTEGER NOT NULL DEFAULT 0,
    `pollVotes` INTEGER NOT NULL DEFAULT 0,

    INDEX `LessonAttendance_studentId_idx`(`studentId`),
    UNIQUE INDEX `LessonAttendance_lessonId_externalUserId_key`(`lessonId`, `externalUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LessonStats` ADD CONSTRAINT `LessonStats_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonAttendance` ADD CONSTRAINT `LessonAttendance_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonAttendance` ADD CONSTRAINT `LessonAttendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

