import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getRunningMeetingIds } from "@/lib/bbb";
import { finalizePollStats, snapshotLiveAttendance } from "@/lib/lesson-stats";

const THROTTLE_MS = 10_000;
const g = globalThis as unknown as { __lessonSyncAt?: number; __lessonSyncPromise?: Promise<void> };

/**
 * Ders durumlarını BBB ile eşitler:
 *  - Odası açık olan SCHEDULED dersler → LIVE
 *  - Odası kapanmış LIVE dersler → ENDED
 * BBB'ye ulaşılamazsa sessizce geçer. Aynı anda birden çok çağrı tek isteğe indirgenir.
 */
export async function syncLessonStatuses(force = false) {
  const now = Date.now();
  if (!force && g.__lessonSyncAt && now - g.__lessonSyncAt < THROTTLE_MS) return;
  if (g.__lessonSyncPromise) return g.__lessonSyncPromise;

  g.__lessonSyncPromise = (async () => {
    try {
      const candidates = await prisma.lesson.findMany({
        where: { status: { in: ["SCHEDULED", "LIVE"] } },
        select: { id: true, meetingId: true, status: true },
      });
      if (candidates.length === 0) return;

      const running = await getRunningMeetingIds();
      const toLive = candidates.filter((l) => l.status === "SCHEDULED" && running.has(l.meetingId)).map((l) => l.id);
      const toEnded = candidates.filter((l) => l.status === "LIVE" && !running.has(l.meetingId)).map((l) => l.id);

      await prisma.$transaction([
        ...(toLive.length ? [prisma.lesson.updateMany({ where: { id: { in: toLive } }, data: { status: "LIVE" } })] : []),
        ...(toEnded.length ? [prisma.lesson.updateMany({ where: { id: { in: toEnded } }, data: { status: "ENDED" } })] : []),
      ]);
      g.__lessonSyncAt = Date.now();

      // Canlı derslerde yoklama al; bitenler için özet çıkar.
      const live = candidates.filter((l) => running.has(l.meetingId));
      if (live.length) await snapshotLiveAttendance(live);
      for (const id of toEnded) await finalizePollStats(id);
    } catch (e) {
      console.warn("[lesson-sync] BBB eşitleme atlandı:", e instanceof Error ? e.message : e);
    } finally {
      g.__lessonSyncPromise = undefined;
    }
  })();
  return g.__lessonSyncPromise;
}

/** BBB geri çağrıları için imza. */
export function signLessonId(lessonId: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "").update(lessonId).digest("hex");
}

export function verifyLessonSignature(lessonId: string, sig: string) {
  const expected = Buffer.from(signLessonId(lessonId));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
