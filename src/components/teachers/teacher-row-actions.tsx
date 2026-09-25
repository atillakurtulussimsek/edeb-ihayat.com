"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, PowerIcon, ShieldCheckIcon, ShieldOffIcon } from "lucide-react";
import type { Role } from "@/generated/prisma/client";
import { setStaffRole, toggleTeacherActive } from "@/lib/actions/teachers";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function TeacherRowActions({ teacher, canManageRole }: { teacher: { id: string; name: string; active: boolean; role: Role }; canManageRole: boolean }) {
  const [pending, start] = useTransition();
  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${teacher.name} işlemleri`} disabled={pending} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run(() => toggleTeacherActive(teacher.id))}>
          <PowerIcon /> {teacher.active ? "Pasife al" : "Aktif et"}
        </DropdownMenuItem>
        {canManageRole && (
          <>
            <DropdownMenuSeparator />
            {teacher.role === "ADMIN" ? (
              <DropdownMenuItem onClick={() => run(() => setStaffRole(teacher.id, "TEACHER"))}>
                <ShieldOffIcon /> Yöneticilikten al
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => run(() => setStaffRole(teacher.id, "ADMIN"))}>
                <ShieldCheckIcon /> Yönetici yap
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
