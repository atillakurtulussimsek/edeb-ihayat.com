"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase().trim(),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "E-posta veya şifre hatalı." };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Şifreler eşleşmiyor.", path: ["confirm"] });

export type ChangePasswordState = { error?: string };

export async function setInitialPasswordAction(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz şifre." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (user && (await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "Yeni şifre eskisiyle aynı olamaz." };
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10), mustChangePassword: false },
  });
  redirect("/dashboard");
}
