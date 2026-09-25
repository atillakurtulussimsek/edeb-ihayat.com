import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface Session {
    user: { id: string; name: string; email: string; role: Role };
  }
  interface User {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Yalnız öğretmen (ders/öğrenci oluşturma-düzenleme). */
export async function requireTeacher() {
  const user = await requireUser();
  if (user.role !== "TEACHER") redirect("/dashboard");
  return user;
}

/** Öğretmen veya yönetici (görüntüleme, öğretmen yönetimi). */
export async function requireStaff() {
  const user = await requireUser();
  if (user.role === "STUDENT") redirect("/dashboard");
  return user;
}

export type SessionUser = { id: string; name: string; email: string; role: Role };

/** Ders sorgularında rol bazlı kapsam: yönetici her şeyi, öğretmen kendini, öğrenci kayıtlı olduğu dersleri görür. */
export function lessonScope(user: SessionUser) {
  if (user.role === "ADMIN") return {};
  if (user.role === "TEACHER") return { teacherId: user.id };
  return { students: { some: { studentId: user.id } } };
}
