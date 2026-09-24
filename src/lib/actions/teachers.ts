"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/auth";
import type { ActionResult } from "./students";

const teacherSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı."),
  email: z.string().trim().email("Geçerli bir e-posta girin.").toLowerCase(),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
});

export async function createTeacher(formData: FormData): Promise<ActionResult> {
  await requireTeacher();
  const parsed = teacherSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  const { name, email, phone, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) return { ok: false, error: "Bu e-posta zaten kayıtlı." };
  await prisma.user.create({ data: { name, email, phone, role: "TEACHER", passwordHash: await bcrypt.hash(password, 10), mustChangePassword: true } });
  revalidatePath("/teachers");
  return { ok: true, message: "Öğretmen eklendi." };
}

export async function toggleTeacherActive(id: string): Promise<ActionResult> {
  const me = await requireTeacher();
  if (me.id === id) return { ok: false, error: "Kendi hesabınızı pasife alamazsınız." };
  const t = await prisma.user.findFirst({ where: { id, role: "TEACHER" } });
  if (!t) return { ok: false, error: "Öğretmen bulunamadı." };
  await prisma.user.update({ where: { id }, data: { active: !t.active } });
  revalidatePath("/teachers");
  return { ok: true, message: t.active ? "Öğretmen pasife alındı." : "Öğretmen aktif edildi." };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı."),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı.").optional().or(z.literal("")),
});

export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
  const me = await requireTeacher();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  const { name, phone, password } = parsed.data;
  await prisma.user.update({
    where: { id: me.id },
    data: { name, phone, ...(password ? { passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false } : {}) },
  });
  revalidatePath("/teachers");
  return { ok: true, message: "Profil güncellendi." };
}
