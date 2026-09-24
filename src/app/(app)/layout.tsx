import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { mustChangePassword: true, active: true } });
  if (!u || !u.active) redirect("/login");
  if (u.mustChangePassword) redirect("/change-password");
  return <AppShell user={session.user}>{children}</AppShell>;
}
