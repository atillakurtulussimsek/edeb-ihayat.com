import { redirect } from "next/navigation";
import { KeyRoundIcon } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Şifre belirle" };

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { mustChangePassword: true, name: true } });
  if (!u?.mustChangePassword) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="paper-card w-full max-w-sm rounded-2xl p-8 ring-1 ring-foreground/8">
        <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground"><KeyRoundIcon className="size-5" /></span>
        <h1 className="mt-5 font-heading text-2xl font-medium tracking-tight">Hoş geldiniz, {u.name.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hesabınız sizin için oluşturuldu. Devam etmeden önce yalnızca sizin bildiğiniz yeni bir şifre belirleyin.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
