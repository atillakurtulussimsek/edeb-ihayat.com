"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, SquareIcon, BanIcon, Trash2Icon } from "lucide-react";
import type { LessonStatus } from "@/generated/prisma/client";
import { cancelLesson, deleteLesson, endLesson } from "@/lib/actions/lessons";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function LessonActions({ lessonId, status }: { lessonId: string; status: LessonStatus }) {
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message?: string; error?: string } | void>) {
    start(async () => {
      const r = await fn();
      if (r && !r.ok) toast.error(r.error);
      else if (r?.ok) toast.success(r.message);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon-lg" aria-label="Diğer işlemler" disabled={pending} />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "LIVE" && (
          <DropdownMenuItem onClick={() => run(() => endLesson(lessonId))}>
            <SquareIcon /> Dersi sonlandır
          </DropdownMenuItem>
        )}
        {status === "SCHEDULED" && (
          <DropdownMenuItem onClick={() => run(() => cancelLesson(lessonId))}>
            <BanIcon /> Dersi iptal et
          </DropdownMenuItem>
        )}
        {(status === "LIVE" || status === "SCHEDULED") && <DropdownMenuSeparator />}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (confirm("Bu ders kalıcı olarak silinecek. Emin misiniz?")) run(() => deleteLesson(lessonId));
          }}
        >
          <Trash2Icon /> Dersi sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
