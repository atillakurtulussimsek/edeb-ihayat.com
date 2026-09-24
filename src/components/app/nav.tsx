"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, GraduationCapIcon, LayoutDashboardIcon, UsersIcon, VideoIcon, type LucideIcon } from "lucide-react";
import type { Role } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; roles: Role[] };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboardIcon, roles: ["TEACHER", "STUDENT"] },
  { href: "/lessons", label: "Dersler", icon: CalendarDaysIcon, roles: ["TEACHER", "STUDENT"] },
  { href: "/students", label: "Öğrenciler", icon: UsersIcon, roles: ["TEACHER"] },
  { href: "/recordings", label: "Kayıtlar", icon: VideoIcon, roles: ["TEACHER", "STUDENT"] },
  { href: "/teachers", label: "Öğretmenler", icon: GraduationCapIcon, roles: ["TEACHER"] },
];

function useItems(role: Role) {
  const pathname = usePathname();
  return ITEMS.filter((i) => i.roles.includes(role)).map((i) => ({
    ...i,
    active: pathname === i.href || pathname.startsWith(`${i.href}/`),
  }));
}

export function SidebarNav({ role }: { role: Role }) {
  const items = useItems(role);
  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Ana menü">
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const items = useItems(role);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      aria-label="Alt menü"
    >
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
            active ? "text-brand" : "text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
