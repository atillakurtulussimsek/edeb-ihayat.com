import type { Role } from "@/generated/prisma/client";
import { SidebarNav, MobileNav } from "./nav";
import { UserMenu } from "./user-menu";

type ShellUser = { id: string; name: string; email: string; role: Role };

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-heading text-base font-semibold text-primary-foreground">E</span>
          <div className="leading-tight">
            <div className="font-heading text-lg">Edebi Hayat</div>
            <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
              {user.role === "ADMIN" ? "Yönetici paneli" : user.role === "TEACHER" ? "Öğretmen paneli" : "Öğrenci paneli"}
            </div>
          </div>
        </div>
        <SidebarNav role={user.role} />
        <div className="mt-auto border-t border-sidebar-border p-3">
          <UserMenu user={user} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <span className="font-heading text-lg">Edebi Hayat</span>
          <UserMenu user={user} compact />
        </header>
        <main className="flex-1 px-4 pt-6 pb-24 sm:px-6 md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileNav role={user.role} />
      </div>
    </div>
  );
}
