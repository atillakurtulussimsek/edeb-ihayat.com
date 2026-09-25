import Link from "next/link";
import { addDays, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { CalendarDaysIcon, PlusIcon, UsersIcon, VideoIcon, ClockIcon } from "lucide-react";
import { lessonScope, requireUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLessonStatuses } from "@/lib/lesson-sync";
import { AutoRefresh } from "@/components/app/auto-refresh";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { LessonCard } from "@/components/lessons/lesson-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Panel" };
export const dynamic = "force-dynamic";

const lessonInclude = { students: { include: { student: { select: { id: true, name: true } } } } } as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const isTeacher = user.role === "TEACHER";
  const isStaff = user.role !== "STUDENT";
  await syncLessonStatuses();
  const now = new Date();
  const today = startOfDay(now);
  const studentFilter = lessonScope(user);

  const [live, upcoming, weekCount, studentCount, endedCount] = await Promise.all([
    prisma.lesson.findMany({ where: { ...studentFilter, status: "LIVE" }, include: lessonInclude, orderBy: { startsAt: "asc" } }),
    prisma.lesson.findMany({
      where: { ...studentFilter, status: "SCHEDULED", startsAt: { gte: today } },
      include: lessonInclude,
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    prisma.lesson.count({
      where: { ...studentFilter, status: { in: ["SCHEDULED", "LIVE"] }, startsAt: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) } },
    }),
    isStaff ? prisma.user.count({ where: { role: "STUDENT", active: true, ...(isTeacher ? { teacherId: user.id } : {}) } }) : Promise.resolve(0),
    prisma.lesson.count({ where: { ...studentFilter, status: "ENDED" } }),
  ]);

  const todays = upcoming.filter((l) => l.startsAt < addDays(today, 1));
  const later = upcoming.filter((l) => l.startsAt >= addDays(today, 1));
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <AutoRefresh />
      <PageHeader
        eyebrow={fmtDate(now)}
        title={`Merhaba, ${firstName}`}
        description={
          user.role === "ADMIN"
            ? "Tüm öğretmenlerin derslerini buradan izleyebilirsiniz."
            : isTeacher
              ? "Bugünkü derslerinizi başlatın, takviminizi yönetin."
              : "Yaklaşan derslerinizi buradan takip edin."
        }
        actions={
          isTeacher && (
            <Link href="/lessons/new" className={buttonVariants({ size: "lg", className: "bg-brand text-brand-foreground hover:bg-brand/90" })}>
              <PlusIcon /> Yeni ders
            </Link>
          )
        }
      />

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat icon={CalendarDaysIcon} label="Bu hafta" value={weekCount} hint="planlı ders" />
        {isStaff ? (
          <Stat icon={UsersIcon} label="Aktif öğrenci" value={studentCount} hint="kayıtlı" />
        ) : (
          <Stat icon={ClockIcon} label="Canlı şu an" value={live.length} hint="ders" />
        )}
        <Stat icon={VideoIcon} label="Tamamlanan" value={endedCount} hint="ders" />
      </section>

      {live.length > 0 && (
        <Section title="Şu an canlı" accent>
          <div className="grid gap-4 md:grid-cols-2">
            {live.map((l) => <LessonCard key={l.id} lesson={l} isTeacher={isTeacher} viewerRole={user.role} />)}
          </div>
        </Section>
      )}

      <Section title="Bugün">
        {todays.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {todays.map((l) => <LessonCard key={l.id} lesson={l} isTeacher={isTeacher} viewerRole={user.role} />)}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDaysIcon}
            title="Bugün için planlı ders yok"
            description={isTeacher ? "Yeni bir ders planlayarak öğrencilerinizi davet edin." : user.role === "ADMIN" ? "Öğretmenler ders planladığında burada görünür." : "Öğretmeniniz ders planladığında burada görünür."}
            action={isTeacher && <Link href="/lessons/new" className={buttonVariants({ variant: "outline" })}>Ders planla</Link>}
          />
        )}
      </Section>

      {later.length > 0 && (
        <Section title="Yaklaşan" link={{ href: "/lessons", label: "Tümünü gör" }}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {later.map((l) => <LessonCard key={l.id} lesson={l} isTeacher={isTeacher} viewerRole={user.role} />)}
          </div>
        </Section>
      )}
    </>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof CalendarDaysIcon; label: string; value: number; hint: string }) {
  return (
    <div className="paper-card flex items-center gap-4 rounded-2xl p-4 ring-1 ring-foreground/8">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <div className="leading-tight">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-heading text-2xl">
          {value} <span className="text-sm font-sans text-muted-foreground">{hint}</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, accent, link, children }: { title: string; accent?: boolean; link?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-xl">
          {accent && <span className="live-dot size-2 rounded-full bg-live" />}
          {title}
        </h2>
        {link && <Link href={link.href} className="text-sm text-brand hover:underline">{link.label}</Link>}
      </div>
      {children}
    </section>
  );
}
