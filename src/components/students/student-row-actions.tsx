"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, PencilIcon, PowerIcon, Trash2Icon } from "lucide-react";
import { deleteStudent, toggleStudentActive } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StudentDialog, type StudentValues } from "./student-dialog";

export function StudentRowActions({ student }: { student: StudentValues & { active: boolean } }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${student.name} işlemleri`} disabled={pending} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}><PencilIcon /> Düzenle</DropdownMenuItem>
          <DropdownMenuItem onClick={() => run(() => toggleStudentActive(student.id))}>
            <PowerIcon /> {student.active ? "Pasife al" : "Aktif et"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              if (confirm(`${student.name} silinecek. Ders kayıtları da kaldırılır. Emin misiniz?`)) run(() => deleteStudent(student.id));
            }}
          >
            <Trash2Icon /> Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StudentDialog student={student} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
