import { prisma } from "@/lib/prisma";
import { getMeetingInfo } from "@/lib/bbb";
import type { Prisma } from "@/generated/prisma/client";

const sec = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000));

/** Canlı derste odadaki katılımcıları yoklar; ilk görülme/son görülme zamanlarını tutar. */
export async function snapshotLiveAttendance(lessons: { id: string; meetingId: string }[]) {
  const now = new Date();
  for (const lesson of lessons) {
    const info = await getMeetingInfo(lesson.meetingId);
    if (!info) continue;

    const present = new Set(info.attendees.map((a) => a.userID));
    const known = await prisma.lessonAttendance.findMany({ where: { lessonId: lesson.id }, select: { externalUserId: true, leftAt: true } });
    const knownIds = new Set(known.map((k) => k.externalUserId));
    const studentIds = new Set((await prisma.user.findMany({ where: { id: { in: [...present] } }, select: { id: true } })).map((u) => u.id));

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const a of info.attendees) {
      const isMod = a.role === "MODERATOR";
      if (knownIds.has(a.userID)) {
        ops.push(prisma.lessonAttendance.update({ where: { lessonId_externalUserId: { lessonId: lesson.id, externalUserId: a.userID } }, data: { lastSeenAt: now, leftAt: null, name: a.fullName, moderator: isMod } }));
      } else {
        ops.push(prisma.lessonAttendance.create({ data: { lessonId: lesson.id, externalUserId: a.userID, studentId: studentIds.has(a.userID) ? a.userID : null, name: a.fullName, moderator: isMod, joinedAt: now, lastSeenAt: now } }));
      }
    }
    const gone = known.filter((k) => !present.has(k.externalUserId) && !k.leftAt).map((k) => k.externalUserId);
    if (gone.length) ops.push(prisma.lessonAttendance.updateMany({ where: { lessonId: lesson.id, externalUserId: { in: gone } }, data: { leftAt: now } }));
    if (ops.length) await prisma.$transaction(ops);
  }
}

/** Ders bitince yoklama verisinden özet üretir (analytics geri çağrısı gelmediyse kullanılır). */
export async function finalizePollStats(lessonId: string) {
  const now = new Date();
  const rows = await prisma.lessonAttendance.findMany({ where: { lessonId } });
  if (rows.length === 0) return;

  const existing = await prisma.lessonStats.findUnique({ where: { lessonId }, select: { source: true } });
  if (existing?.source === "analytics") return;

  const startedAt = new Date(Math.min(...rows.map((r) => r.joinedAt.getTime())));
  const endedAt = new Date(Math.max(...rows.map((r) => (r.leftAt ?? r.lastSeenAt).getTime())));

  await prisma.$transaction([
    ...rows.map((r) =>
      prisma.lessonAttendance.update({
        where: { id: r.id },
        data: { leftAt: r.leftAt ?? r.lastSeenAt, durationSec: sec(r.joinedAt, r.leftAt ?? r.lastSeenAt) },
      })
    ),
    prisma.lessonStats.upsert({
      where: { lessonId },
      create: { lessonId, source: "poll", startedAt, endedAt, durationSec: sec(startedAt, endedAt), participantCount: rows.filter((r) => !r.moderator).length },
      update: { source: "poll", startedAt, endedAt, durationSec: sec(startedAt, endedAt), participantCount: rows.filter((r) => !r.moderator).length, updatedAt: now },
    }),
  ]);
}

type AnalyticsAttendee = {
  ext_user_id?: string;
  name?: string;
  moderator?: boolean;
  join?: number;
  leaves?: number[];
  duration?: number;
  engagement?: { chats?: number; talks?: number; raisehand?: number; emojis?: number; poll_votes?: number; talk_time?: number; webcam_time?: number };
};

type AnalyticsPayload = {
  meeting_id?: string;
  data?: { start?: number; finish?: number; duration?: number; attendees?: AnalyticsAttendee[]; polls?: unknown[] };
};

/** BBB Learning Analytics geri çağrısı: ders bitince gelen ayrıntılı etkileşim verisini işler. */
export async function applyAnalytics(lessonId: string, payload: AnalyticsPayload) {
  const d = payload.data ?? {};
  const attendees = d.attendees ?? [];
  const ids = attendees.map((a) => a.ext_user_id).filter((x): x is string => Boolean(x));
  const studentIds = new Set((await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((u) => u.id));

  const startedAt = d.start ? new Date(d.start) : null;
  const endedAt = d.finish ? new Date(d.finish) : null;

  const ops: Prisma.PrismaPromise<unknown>[] = attendees
    .filter((a) => a.ext_user_id)
    .map((a) => {
      const e = a.engagement ?? {};
      const joinedAt = a.join ? new Date(a.join) : startedAt ?? new Date();
      const lastLeave = a.leaves?.length ? new Date(Math.max(...a.leaves)) : endedAt ?? joinedAt;
      const data = {
        name: a.name ?? "",
        moderator: Boolean(a.moderator),
        studentId: studentIds.has(a.ext_user_id!) ? a.ext_user_id! : null,
        joinedAt,
        lastSeenAt: lastLeave,
        leftAt: lastLeave,
        durationSec: Math.round(a.duration ?? sec(joinedAt, lastLeave)),
        talkTimeSec: Math.round(e.talk_time ?? 0),
        webcamTimeSec: Math.round(e.webcam_time ?? 0),
        messages: e.chats ?? 0,
        raisedHands: e.raisehand ?? 0,
        emojis: e.emojis ?? 0,
        pollVotes: e.poll_votes ?? 0,
      };
      return prisma.lessonAttendance.upsert({
        where: { lessonId_externalUserId: { lessonId, externalUserId: a.ext_user_id! } },
        create: { lessonId, externalUserId: a.ext_user_id!, ...data },
        update: data,
      });
    });

  const summary = {
    source: "analytics",
    startedAt,
    endedAt,
    durationSec: Math.round(d.duration ?? (startedAt && endedAt ? sec(startedAt, endedAt) : 0)),
    participantCount: attendees.filter((a) => !a.moderator).length,
    totalMessages: attendees.reduce((n, a) => n + (a.engagement?.chats ?? 0), 0),
    totalTalkSec: Math.round(attendees.reduce((n, a) => n + (a.engagement?.talk_time ?? 0), 0)),
    pollCount: d.polls?.length ?? 0,
    raw: payload as Prisma.InputJsonValue,
  };

  await prisma.$transaction([
    ...ops,
    prisma.lessonStats.upsert({ where: { lessonId }, create: { lessonId, ...summary }, update: summary }),
    prisma.lesson.updateMany({ where: { id: lessonId, status: "LIVE" }, data: { status: "ENDED" } }),
  ]);
}
