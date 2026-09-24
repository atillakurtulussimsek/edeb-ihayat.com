"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher, requireUser } from "@/auth";
import { createMeeting, endMeeting, isMeetingRunning, joinUrl } from "@/lib/bbb";
import { signLessonId } from "@/lib/lesson-sync";
import { finalizePollStats, snapshotLiveAttendance } from "@/lib/lesson-stats";
import type { ActionResult } from "./students";

const lessonSchema = z.object({
  title: z.string().trim().min(2, "Ders adı en az 2 karakter olmalı."),
  description: z.string().trim().optional(),
  type: z.enum(["INDIVIDUAL", "GROUP"]),
  startsAt: z.string().min(1, "Tarih ve saat seçin."),
  durationMin: z.coerce.number().int().min(15, "Süre en az 15 dk.").max(480, "Süre en fazla 8 saat."),
  studentIds: z.array(z.string()).min(1, "En az bir öğrenci seçin."),
});

type ParsedLesson = Omit<z.infer<typeof lessonSchema>, "startsAt"> & { startsAt: Date };

function parseLesson(formData: FormData): { ok: false; error: string } | { ok: true; data: ParsedLesson } {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    type: formData.get("type"),
    startsAt: formData.get("startsAt"),
    durationMin: formData.get("durationMin"),
    studentIds: formData.getAll("studentIds").map(String),
  };
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  if (parsed.data.type === "INDIVIDUAL" && parsed.data.studentIds.length !== 1) {
    return { ok: false, error: "Bireysel ders için tam olarak bir öğrenci seçin." };
  }
  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Geçersiz tarih." };
  return { ok: true, data: { ...parsed.data, startsAt } };
}

const pw = () => randomBytes(9).toString("base64url");

async function assertOwnStudents(teacherId: string, studentIds: string[]) {
  const n = await prisma.user.count({ where: { id: { in: studentIds }, role: "STUDENT", teacherId } });
  return n === studentIds.length;
}

async function ownLesson(id: string) {
  const teacher = await requireTeacher();
  return prisma.lesson.findFirst({ where: { id, teacherId: teacher.id } });
}

export async function createLesson(formData: FormData): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const r = parseLesson(formData);
  if (!r.ok) return { ok: false, error: r.error };
  const { studentIds, ...data } = r.data;
  if (!(await assertOwnStudents(teacher.id, studentIds))) return { ok: false, error: "Seçilen öğrenciler size ait değil." };

  const lesson = await prisma.lesson.create({
    data: {
      ...data,
      teacherId: teacher.id,
      attendeePw: pw(),
      moderatorPw: pw(),
      students: { create: studentIds.map((studentId) => ({ studentId })) },
    },
  });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  redirect(`/lessons/${lesson.id}`);
}

export async function updateLesson(id: string, formData: FormData): Promise<ActionResult> {
  const teacher = await requireTeacher();
  if (!(await ownLesson(id))) return { ok: false, error: "Ders bulunamadı." };
  const r = parseLesson(formData);
  if (!r.ok) return { ok: false, error: r.error };
  const { studentIds, ...data } = r.data;
  if (!(await assertOwnStudents(teacher.id, studentIds))) return { ok: false, error: "Seçilen öğrenciler size ait değil." };

  await prisma.$transaction([
    prisma.lessonStudent.deleteMany({ where: { lessonId: id } }),
    prisma.lesson.update({
      where: { id },
      data: {
        ...data,
        students: { create: studentIds.map((studentId) => ({ studentId })) },
      },
    }),
  ]);
  revalidatePath("/lessons");
  revalidatePath(`/lessons/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Ders güncellendi." };
}

export async function cancelLesson(id: string): Promise<ActionResult> {
  if (!(await ownLesson(id))) return { ok: false, error: "Ders bulunamadı." };
  await prisma.lesson.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/lessons");
  revalidatePath(`/lessons/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Ders iptal edildi." };
}

export async function deleteLesson(id: string): Promise<ActionResult> {
  if (!(await ownLesson(id))) return { ok: false, error: "Ders bulunamadı." };
  await prisma.lesson.delete({ where: { id } });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  redirect("/lessons");
}

export async function endLesson(id: string): Promise<ActionResult> {
  const lesson = await ownLesson(id);
  if (!lesson) return { ok: false, error: "Ders bulunamadı." };
  try {
    if (await isMeetingRunning(lesson.meetingId)) {
      await snapshotLiveAttendance([lesson]);
      await endMeeting(lesson.meetingId, lesson.moderatorPw);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "BBB'ye ulaşılamadı." };
  }
  await prisma.lesson.update({ where: { id }, data: { status: "ENDED" } });
  await finalizePollStats(id);
  revalidatePath("/lessons");
  revalidatePath(`/lessons/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Ders sonlandırıldı." };
}

/** Odayı (gerekirse) oluşturur ve kullanıcıya uygun BBB join URL'sini döner. */
export async function getJoinUrl(lessonId: string): Promise<{ url: string } | { error: string }> {
  const user = await requireUser();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { students: true },
  });
  if (!lesson) return { error: "Ders bulunamadı." };
  if (lesson.status === "CANCELLED") return { error: "Bu ders iptal edildi." };
  if (lesson.status === "ENDED") return { error: "Bu ders tamamlandı." };

  const isTeacher = user.role === "TEACHER";
  if (isTeacher && lesson.teacherId !== user.id) return { error: "Bu ders size ait değil." };
  if (!isTeacher && !lesson.students.some((s) => s.studentId === user.id)) {
    return { error: "Bu derse kayıtlı değilsiniz." };
  }

  try {
    const running = await isMeetingRunning(lesson.meetingId);
    if (!running) {
      if (!isTeacher) return { error: "Ders henüz başlamadı. Öğretmen odayı açınca katılabilirsiniz." };
      await createMeeting({
        meetingId: lesson.meetingId,
        name: lesson.title,
        attendeePw: lesson.attendeePw,
        moderatorPw: lesson.moderatorPw,
        durationMin: lesson.durationMin,
        welcome: `<b>${lesson.title}</b> dersine hoş geldiniz.`,
        maxParticipants: lesson.type === "INDIVIDUAL" ? 3 : undefined,
        endCallbackUrl: process.env.AUTH_URL
          ? `${process.env.AUTH_URL}/api/bbb/end?lesson=${lesson.id}&sig=${signLessonId(lesson.id)}`
          : undefined,
        analyticsCallbackUrl: process.env.AUTH_URL
          ? `${process.env.AUTH_URL}/api/bbb/analytics?lesson=${lesson.id}&sig=${signLessonId(lesson.id)}`
          : undefined,
      });
      await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "LIVE" } });
      revalidatePath("/dashboard");
      revalidatePath(`/lessons/${lesson.id}`);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "BBB sunucusuna ulaşılamadı." };
  }

  if (!isTeacher) {
    await prisma.lessonStudent.update({
      where: { lessonId_studentId: { lessonId: lesson.id, studentId: user.id } },
      data: { joinedAt: new Date() },
    });
  }

  return {
    url: joinUrl({
      meetingId: lesson.meetingId,
      fullName: user.name,
      password: isTeacher ? lesson.moderatorPw : lesson.attendeePw,
      userId: user.id,
      role: isTeacher ? "MODERATOR" : "VIEWER",
    }),
  };
}

export async function joinLessonAction(lessonId: string) {
  const r = await getJoinUrl(lessonId);
  if ("error" in r) return r;
  redirect(r.url);
}
