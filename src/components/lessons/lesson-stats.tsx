import { BarChart3Icon, ClockIcon, MessageSquareIcon, MicIcon, UsersIcon, HandIcon, VideoIcon } from "lucide-react";
import type { LessonAttendance, LessonStats as LessonStatsModel } from "@/generated/prisma/client";
import { fmtTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function fmtDur(s: number) {
  if (s < 60) return `${s} sn`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} dk` : `${Math.floor(m / 60)} sa ${m % 60} dk`;
}

type Student = { id: string; name: string };

export function LessonStatsPanel({
  stats,
  attendances,
  students,
  plannedMin,
  viewerId,
  isTeacher,
}: {
  stats: LessonStatsModel | null;
  attendances: LessonAttendance[];
  students: Student[];
  plannedMin: number;
  viewerId: string;
  isTeacher: boolean;
}) {
  const rows = attendances.filter((a) => !a.moderator);
  const byStudent = new Map(rows.filter((r) => r.studentId).map((r) => [r.studentId!, r]));
  const detailed = stats?.source === "analytics";
  const lessonSec = stats?.durationSec ?? 0;

  const visibleStudents = isTeacher ? students : students.filter((s) => s.id === viewerId);
  const attendedCount = students.filter((s) => byStudent.has(s.id)).length;
  const avgAttendancePct =
    lessonSec > 0 && attendedCount > 0
      ? Math.round(
          (students.reduce((n, s) => n + Math.min(1, (byStudent.get(s.id)?.durationSec ?? 0) / lessonSec), 0) / students.length) * 100
        )
      : 0;

  if (!stats && rows.length === 0) {
    return (
      <section className="paper-card rounded-2xl p-5 ring-1 ring-foreground/8">
        <h2 className="flex items-center gap-2 font-heading text-lg"><BarChart3Icon className="size-4" /> Ders istatistikleri</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bu ders için veri toplanamadı (oda açılmadı veya BBB'ye ulaşılamadı).</p>
      </section>
    );
  }

  return (
    <section className="paper-card rounded-2xl p-5 ring-1 ring-foreground/8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg"><BarChart3Icon className="size-4" /> Ders istatistikleri</h2>
        <span className="text-xs text-muted-foreground">
          {detailed ? "Kaynak: BBB Learning Analytics" : "Kaynak: canlı yoklama (temel veri)"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={ClockIcon} label="Gerçek süre" value={fmtDur(lessonSec)} hint={`plan: ${plannedMin} dk`} />
        <Tile icon={UsersIcon} label="Katılım" value={`${attendedCount}/${students.length}`} hint={`ort. %${avgAttendancePct} sürede`} />
        {detailed ? (
          <>
            <Tile icon={MessageSquareIcon} label="Sohbet mesajı" value={String(stats?.totalMessages ?? 0)} />
            <Tile icon={MicIcon} label="Toplam konuşma" value={fmtDur(stats?.totalTalkSec ?? 0)} hint={stats?.pollCount ? `${stats.pollCount} anket` : undefined} />
          </>
        ) : (
          <>
            <Tile icon={ClockIcon} label="Başlangıç" value={stats?.startedAt ? fmtTime(stats.startedAt) : "—"} />
            <Tile icon={ClockIcon} label="Bitiş" value={stats?.endedAt ? fmtTime(stats.endedAt) : "—"} />
          </>
        )}
      </dl>

      <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-foreground/8">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Öğrenci</TableHead>
              <TableHead>Katıldı</TableHead>
              <TableHead>Süre</TableHead>
              {detailed && (
                <>
                  <TableHead className="hidden sm:table-cell"><span className="inline-flex items-center gap-1"><MicIcon className="size-3.5" /> Konuşma</span></TableHead>
                  <TableHead className="hidden sm:table-cell"><span className="inline-flex items-center gap-1"><VideoIcon className="size-3.5" /> Kamera</span></TableHead>
                  <TableHead className="hidden md:table-cell"><span className="inline-flex items-center gap-1"><MessageSquareIcon className="size-3.5" /> Mesaj</span></TableHead>
                  <TableHead className="hidden md:table-cell"><span className="inline-flex items-center gap-1"><HandIcon className="size-3.5" /> El</span></TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleStudents.map((s) => {
              const a = byStudent.get(s.id);
              const pct = a && lessonSec > 0 ? Math.min(100, Math.round((a.durationSec / lessonSec) * 100)) : 0;
              return (
                <TableRow key={s.id} className={cn(!a && "opacity-70")}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    {a ? <Badge className="bg-live/15 text-live">{fmtTime(a.joinedAt)}</Badge> : <Badge className="bg-destructive/10 text-destructive">Katılmadı</Badge>}
                  </TableCell>
                  <TableCell>
                    {a ? (
                      <div className="flex items-center gap-2">
                        <span className="w-14 text-sm">{fmtDur(a.durationSec)}</span>
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <span className={cn("block h-full rounded-full", pct >= 80 ? "bg-live" : pct >= 50 ? "bg-brand" : "bg-destructive")} style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-xs text-muted-foreground">%{pct}</span>
                      </div>
                    ) : "—"}
                  </TableCell>
                  {detailed && (
                    <>
                      <TableCell className="hidden sm:table-cell">{a ? fmtDur(a.talkTimeSec) : "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{a ? fmtDur(a.webcamTimeSec) : "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{a ? a.messages : "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{a ? a.raisedHands : "—"}</TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {isTeacher && rows.some((r) => !r.studentId) && (
        <p className="mt-3 text-xs text-muted-foreground">
          Platform dışı katılımcı: {rows.filter((r) => !r.studentId).map((r) => r.name).join(", ")}
        </p>
      )}
      {!detailed && isTeacher && (
        <p className="mt-3 text-xs text-muted-foreground">
          Konuşma, kamera ve mesaj verileri için BBB sunucusunda Learning Analytics Dashboard açık olmalı; veri ders bitince otomatik gelir.
        </p>
      )}
    </section>
  );
}

function Tile({ icon: Icon, label, value, hint }: { icon: typeof ClockIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-4" /></span>
      <div className="leading-tight">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-heading text-lg">{value}</dd>
        {hint && <dd className="text-[11px] text-muted-foreground">{hint}</dd>}
      </div>
    </div>
  );
}
