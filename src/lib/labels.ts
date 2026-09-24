import type { LessonStatus, LessonType } from "@/generated/prisma/client";

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  INDIVIDUAL: "Bireysel",
  GROUP: "Grup",
};

export const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  SCHEDULED: "Planlandı",
  LIVE: "Canlı",
  ENDED: "Tamamlandı",
  CANCELLED: "İptal",
};
