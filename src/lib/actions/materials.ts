"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/auth";
import type { ActionResult } from "./students";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED = /^(application\/pdf|application\/vnd\.(openxmlformats-officedocument|ms-|oasis)|application\/msword|application\/zip|text\/|image\/|audio\/|video\/)/;

export async function uploadMaterials(lessonId: string, formData: FormData): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, teacherId: teacher.id }, select: { id: true } });
  if (!lesson) return { ok: false, error: "Ders bulunamadı." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Dosya seçilmedi." };

  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) return { ok: false, error: `${f.name}: 20 MB sınırını aşıyor.` };
    if (!ALLOWED.test(f.type || "")) return { ok: false, error: `${f.name}: desteklenmeyen dosya türü.` };
  }

  const payload = await Promise.all(
    files.map(async (f) => ({
      lessonId,
      name: f.name.slice(0, 180),
      mimeType: f.type || "application/octet-stream",
      size: f.size,
      data: new Uint8Array(await f.arrayBuffer()),
      uploadedById: teacher.id,
    }))
  );
  await prisma.$transaction(payload.map((data) => prisma.lessonMaterial.create({ data })));
  revalidatePath(`/lessons/${lessonId}`);
  return { ok: true, message: files.length === 1 ? "Materyal yüklendi." : `${files.length} materyal yüklendi.` };
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const m = await prisma.lessonMaterial.findFirst({ where: { id, lesson: { teacherId: teacher.id } }, select: { lessonId: true } });
  if (!m) return { ok: false, error: "Materyal bulunamadı." };
  await prisma.lessonMaterial.delete({ where: { id } });
  revalidatePath(`/lessons/${m.lessonId}`);
  return { ok: true, message: "Materyal silindi." };
}
