"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, VideoIcon } from "lucide-react";
import { getJoinUrl } from "@/lib/actions/lessons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function JoinButton({
  lessonId,
  isTeacher,
  live,
  size = "default",
  className,
}: {
  lessonId: string;
  isTeacher: boolean;
  live: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [pending, start] = useTransition();
  const label = isTeacher ? (live ? "Derse dön" : "Dersi başlat") : "Derse katıl";

  return (
    <Button
      size={size}
      disabled={pending}
      className={cn(
        live ? "bg-live text-live-foreground hover:bg-live/90" : "bg-brand text-brand-foreground hover:bg-brand/90",
        className
      )}
      onClick={() =>
        start(async () => {
          const r = await getJoinUrl(lessonId);
          if ("error" in r) {
            toast.error(r.error);
            return;
          }
          window.open(r.url, "_blank", "noopener");
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <VideoIcon />}
      {label}
    </Button>
  );
}
