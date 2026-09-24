"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { PowerIcon } from "lucide-react";
import { toggleTeacherActive } from "@/lib/actions/teachers";
import { Button } from "@/components/ui/button";

export function TeacherRowActions({ teacher }: { teacher: { id: string; name: string; active: boolean } }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`${teacher.name}: ${teacher.active ? "pasife al" : "aktif et"}`}
      onClick={() =>
        start(async () => {
          const r = await toggleTeacherActive(teacher.id);
          if (r.ok) toast.success(r.message);
          else toast.error(r.error);
        })
      }
    >
      <PowerIcon /> {teacher.active ? "Pasife al" : "Aktif et"}
    </Button>
  );
}
