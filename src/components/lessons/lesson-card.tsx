import Link from "next/link";
import { ClockIcon, UsersIcon } from "lucide-react";
import type { Lesson, LessonStudent, User } from "@/generated/prisma/client";
import { fmtDayLabel, fmtTime } from "@/lib/format";
import { JoinButton } from "./join-button";
import { StatusBadge, TypeBadge } from "./status-badge";
import { cn } from "@/lib/utils";

export type LessonWithStudents = Lesson & { students: (LessonStudent & { student: Pick<User, "id" | "name"> })[] };

export function LessonCard({ lesson, isTeacher, className }: { lesson: LessonWithStudents; isTeacher: boolean; className?: string }) {
  const joinable = lesson.status === "SCHEDULED" || lesson.status === "LIVE";
  const names = lesson.students.map((s) => s.student.name);
  return (
    <article
      className={cn(
        "paper-card group relative flex flex-col gap-4 rounded-2xl p-5 ring-1 ring-foreground/8 transition-transform hover:-translate-y-0.5",
        lesson.status === "LIVE" && "ring-live/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{fmtDayLabel(lesson.startsAt)}</p>
          <h3 className="mt-1 truncate font-heading text-xl leading-tight">
            <Link href={`/lessons/${lesson.id}`} className="after:absolute after:inset-0 hover:text-brand">
              {lesson.title}
            </Link>
          </h3>
        </div>
        <StatusBadge status={lesson.status} />
      </div>
      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="size-3.5" />
          <dd>
            {fmtTime(lesson.startsAt)} · {lesson.durationMin} dk
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon className="size-3.5" />
          <dd className="truncate">{names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2">
        <TypeBadge type={lesson.type} />
        {joinable && (
          <div className="relative z-10">
            <JoinButton lessonId={lesson.id} isTeacher={isTeacher} live={lesson.status === "LIVE"} size="sm" />
          </div>
        )}
      </div>
    </article>
  );
}
