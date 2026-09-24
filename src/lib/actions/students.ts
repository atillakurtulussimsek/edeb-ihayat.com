"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/auth";

const studentSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı."),
  email: z.string().trim().email("Geçerli bir e-posta girin.").toLowerCase(),
  phone: z.string().trim().optional(),
  note: z.string().trim().optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı.").optional().or(z.literal("")),
});

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Geçersiz veri.";
}

export async function createStudent(formData: FormData): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, email, phone, note, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "Bu e-posta zaten kayıtlı." };

  const plain = password || Math.random().toString(36).slice(-8);
  await prisma.user.create({
    data: { name, email, phone, note, role: "STUDENT", teacherId: teacher.id, passwordHash: await bcrypt.hash(plain, 10) },
  });
  revalidatePath("/students");
  return { ok: true, message: password ? "Öğrenci eklendi." : `Öğrenci eklendi. Geçici şifre: ${plain}` };
}

async function ownStudent(id: string) {
  const teacher = await requireTeacher();
  const s = await prisma.user.findFirst({ where: { id, role: "STUDENT", teacherId: teacher.id } });
  return s;
}

export async function updateStudent(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await ownStudent(id))) return { ok: false, error: "Öğrenci bulunamadı." };
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, email, phone, note, password } = parsed.data;

  const clash = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (clash) return { ok: false, error: "Bu e-posta başka bir hesapta kayıtlı." };

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      note,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });
  revalidatePath("/students");
  return { ok: true, message: "Öğrenci güncellendi." };
}

export async function toggleStudentActive(id: string): Promise<ActionResult> {
  const s = await ownStudent(id);
  if (!s) return { ok: false, error: "Öğrenci bulunamadı." };
  await prisma.user.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/students");
  return { ok: true, message: s.active ? "Öğrenci pasife alındı." : "Öğrenci aktif edildi." };
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  if (!(await ownStudent(id))) return { ok: false, error: "Öğrenci bulunamadı." };
  await prisma.user.delete({ where: { id, role: "STUDENT" } });
  revalidatePath("/students");
  revalidatePath("/lessons");
  return { ok: true, message: "Öğrenci silindi." };
}
