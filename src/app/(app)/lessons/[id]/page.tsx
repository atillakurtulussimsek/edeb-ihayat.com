import Link from "next/link";
import { notFound } from "next/navigation";
import { ClockIcon, CalendarIcon, PencilIcon, PlayIcon, UsersIcon, VideoIcon } from "lucide-react";
import { requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLessonStatuses } from "@/lib/lesson-sync";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { getMeetingInfo, getRecordings, type Recording } from "@/lib/bbb";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { JoinButton } from "@/components/lessons/join-button";
import { StatusBadge, TypeBadge } from "@/components/lessons/status-badge";
import { LessonActions } from "@/components/lessons/lesson-actions";
import { LessonStatsPanel } from "@/components/lessons/lesson-stats";
import { MaterialsPanel } from "@/components/lessons/materials-panel";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params, searchParams }: PageProps<"/lessons/[id]">) {
  const user = await requireUser();
  const isTeacher = user.role === "TEACHER";
  const isAdmin = user.role === "ADMIN";
  const isStaff = isTeacher || isAdmin;
  const { id } = await params;
  const sp = await searchParams;
  await syncLessonStatuses();

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      students: { include: { student: { select: { id: true, name: true, email: true } } } },
      teacher: { select: { name: true, email: true } },
      stats: true,
      attendances: { orderBy: { joinedAt: "asc" } },
      materials: { select: { id: true, name: true, mimeType: true, size: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lesson) notFound();
  if (isTeacher && lesson.teacherId !== user.id) notFound();
  if (!isStaff && !lesson.students.some((s) => s.studentId === user.id)) notFound();

  const [info, recordings] = await Promise.all([
    lesson.status === "LIVE" ? getMeetingInfo(lesson.meetingId) : Promise.resolve(null),
    lesson.status === "ENDED" ? getRecordings([lesson.meetingId]).catch(() => [] as Recording[]) : Promise.resolve([] as Recording[]),
  ]);
  const joinable = isAdmin ? lesson.status === "LIVE" : lesson.status === "SCHEDULED" || lesson.status === "LIVE";
  const errorMsg = typeof sp.error === "string" ? sp.error : null;

  return (
    <>
      <AutoRefresh intervalMs={15_000} />
      <div className="mb-6">
        <Link href="/lessons" className="text-sm text-muted-foreground hover:text-foreground">← Dersler</Link>
      </div>
      <PageHeader
        eyebrow={isAdmin ? `${fmtDate(lesson.startsAt)} · ${lesson.teacher.name}` : fmtDate(lesson.startsAt)}
        title={lesson.title}
        actions={
          <>
            {joinable && <JoinButton lessonId={lesson.id} isTeacher={isStaff} live={lesson.status === "LIVE"} size="lg" />}
            {isTeacher && lesson.status !== "ENDED" && (
              <Link href={`/lessons/${lesson.id}/edit`} className={buttonVariants({ variant: "outline", size: "lg" })}>
                <PencilIcon /> Düzenle
              </Link>
            )}
            {isTeacher && <LessonActions lessonId={lesson.id} status={lesson.status} />}
          </>
        }
      />

      {errorMsg && <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorMsg}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="paper-card rounded-2xl p-5 ring-1 ring-foreground/8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lesson.status} />
              <TypeBadge type={lesson.type} />
              <span className="text-xs text-muted-foreground">· Kaydedilir</span>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <Fact icon={CalendarIcon} label="Tarih" value={fmtDate(lesson.startsAt)} />
              <Fact icon={ClockIcon} label="Saat" value={`${fmtTime(lesson.startsAt)} · ${lesson.durationMin} dk`} />
              <Fact icon={UsersIcon} label="Katılımcı" value={`${lesson.students.length} öğrenci`} />
            </dl>
            {lesson.description && <p className="mt-5 text-sm/6 whitespace-pre-line text-foreground/80">{lesson.description}</p>}
          </section>

          {lesson.status === "LIVE" && (
            <section className="rounded-2xl bg-live/10 p-5 ring-1 ring-live/30">
              <h2 className="flex items-center gap-2 font-heading text-lg">
                <span className="live-dot size-2 rounded-full bg-live" /> Ders şu an canlı
              </h2>
              {info ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Odada {info.participantCount} kişi var{info.attendees.length ? `: ${info.attendees.map((a) => a.fullName).join(", ")}` : "."}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Oda bilgisi alınamadı.</p>
              )}
            </section>
          )}

          <MaterialsPanel lessonId={lesson.id} materials={lesson.materials} isTeacher={isTeacher} />

          {lesson.status === "ENDED" && (
            <LessonStatsPanel
              stats={lesson.stats}
              attendances={lesson.attendances}
              students={lesson.students.map((s) => ({ id: s.student.id, name: s.student.name }))}
              plannedMin={lesson.durationMin}
              viewerId={user.id}
              isTeacher={isStaff}
            />
          )}

          {lesson.status === "ENDED" && (
            <section className="paper-card rounded-2xl p-5 ring-1 ring-foreground/8">
              <h2 className="flex items-center gap-2 font-heading text-lg"><VideoIcon className="size-4" /> Ders kaydı</h2>
              {recordings.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Kayıt henüz hazır değil. İşleme birkaç dakika sürebilir.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recordings.map((r) => (
                    <li key={r.recordId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <span>{fmtDateTime(r.startTime)}</span>
                      {r.playbackUrl && r.published ? (
                        <a href={r.playbackUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm", variant: "outline" })}>
                          <PlayIcon /> İzle
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">İşleniyor</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="paper-card h-fit rounded-2xl p-5 ring-1 ring-foreground/8">
          <h2 className="font-heading text-lg">Öğrenciler</h2>
          <ul className="mt-3 space-y-2">
            {lesson.students.map(({ student, joinedAt }) => (
              <li key={student.id} className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                    {student.name.split(" ").slice(0, 2).map((p) => p[0]?.toLocaleUpperCase("tr")).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-medium">{student.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {joinedAt ? `Katıldı · ${fmtTime(joinedAt)}` : isStaff ? student.email : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof ClockIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-brand" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
