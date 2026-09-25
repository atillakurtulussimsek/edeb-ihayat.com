import { VideoIcon, PlayIcon, AlertTriangleIcon } from "lucide-react";
import { lessonScope, requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRecordings, type Recording } from "@/lib/bbb";
import { fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Kayıtlar" };
export const dynamic = "force-dynamic";

export default async function RecordingsPage() {
  const user = await requireUser();
  const isTeacher = user.role === "TEACHER";

  const lessons = await prisma.lesson.findMany({
    where: lessonScope(user),
    select: { id: true, meetingId: true, title: true, type: true },
  });
  const byMeeting = new Map(lessons.map((l) => [l.meetingId, l]));

  let recordings: Recording[] = [];
  let error: string | null = null;
  if (lessons.length > 0) {
    try {
      recordings = (await getRecordings(user.role === "STUDENT" ? lessons.map((l) => l.meetingId) : undefined))
        .filter((r) => byMeeting.has(r.meetingId))
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    } catch (e) {
      error = e instanceof Error ? e.message : "Kayıtlar alınamadı.";
    }
  }

  return (
    <>
      <PageHeader title="Kayıtlar" description="Tüm dersler otomatik kaydedilir. İşleme birkaç dakika sürebilir." />
      {error && (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangleIcon className="size-4" /> {error}
        </p>
      )}
      {recordings.length === 0 && !error ? (
        <EmptyState icon={VideoIcon} title="Henüz kayıt yok" description="Kayıt açık olan bir ders tamamlandığında burada listelenir." />
      ) : (
        <ul className="grid gap-3">
          {recordings.map((r) => {
            const lesson = byMeeting.get(r.meetingId)!;
            const mins = Math.max(1, Math.round((r.endTime.getTime() - r.startTime.getTime()) / 60000));
            return (
              <li key={r.recordId} className="paper-card flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-foreground/8 sm:flex-row sm:items-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <VideoIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-heading text-lg">{lesson.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {fmtDateTime(r.startTime)} · {mins} dk
                  </div>
                </div>
                {r.playbackUrl && r.published ? (
                  <a href={r.playbackUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
                    <PlayIcon /> İzle
                  </a>
                ) : (
                  <Badge variant="secondary">İşleniyor</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
