import Link from "next/link";
import { CalendarDaysIcon, PlusIcon } from "lucide-react";
import { lessonScope, requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLessonStatuses } from "@/lib/lesson-sync";
import { AutoRefresh } from "@/components/app/auto-refresh";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { LessonCard } from "@/components/lessons/lesson-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dersler" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "upcoming", label: "Yaklaşan" },
  { key: "past", label: "Geçmiş" },
  { key: "cancelled", label: "İptal" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

export default async function LessonsPage({ searchParams }: PageProps<"/lessons">) {
  const user = await requireUser();
  const isTeacher = user.role === "TEACHER";
  await syncLessonStatuses();
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.f) ? sp.f : "upcoming") as Filter;
  const scope = lessonScope(user);

  const where: Prisma.LessonWhereInput =
    filter === "upcoming"
      ? { ...scope, status: { in: ["SCHEDULED", "LIVE"] } }
      : filter === "past"
        ? { ...scope, status: "ENDED" }
        : { ...scope, status: "CANCELLED" };

  const lessons = await prisma.lesson.findMany({
    where,
    include: { students: { include: { student: { select: { id: true, name: true } } } }, teacher: { select: { name: true } } },
    orderBy: { startsAt: filter === "upcoming" ? "asc" : "desc" },
    take: 60,
  });

  return (
    <>
      <AutoRefresh />
      <PageHeader
        title="Dersler"
        description={user.role === "ADMIN" ? "Tüm öğretmenlerin dersleri." : isTeacher ? "Planlanan, tamamlanan ve iptal edilen tüm dersler." : "Kayıtlı olduğunuz dersler."}
        actions={
          isTeacher && (
            <Link href="/lessons/new" className={buttonVariants({ size: "lg", className: "bg-brand text-brand-foreground hover:bg-brand/90" })}>
              <PlusIcon /> Yeni ders
            </Link>
          )
        }
      />
      <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1 w-fit" role="tablist">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/lessons?f=${f.key}`}
            role="tab"
            aria-selected={filter === f.key}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {lessons.length === 0 ? (
        <EmptyState icon={CalendarDaysIcon} title="Bu listede ders yok" description={filter === "upcoming" ? "Yeni bir ders planlandığında burada görünür." : undefined} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => <LessonCard key={l.id} lesson={l} isTeacher={isTeacher} viewerRole={user.role} teacherName={user.role === "ADMIN" ? l.teacher.name : undefined} />)}
        </div>
      )}
    </>
  );
}
