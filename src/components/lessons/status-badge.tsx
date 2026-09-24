import type { LessonStatus, LessonType } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { LESSON_STATUS_LABEL, LESSON_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: LessonStatus; className?: string }) {
  if (status === "LIVE") {
    return (
      <Badge className={cn("gap-1.5 bg-live text-live-foreground", className)}>
        <span className="live-dot size-1.5 rounded-full bg-live-foreground" />
        {LESSON_STATUS_LABEL.LIVE}
      </Badge>
    );
  }
  const styles: Record<Exclude<LessonStatus, "LIVE">, string> = {
    SCHEDULED: "bg-primary/10 text-primary dark:bg-primary/15",
    ENDED: "bg-muted text-muted-foreground",
    CANCELLED: "bg-destructive/10 text-destructive",
  };
  return <Badge className={cn(styles[status], className)}>{LESSON_STATUS_LABEL[status]}</Badge>;
}

export function TypeBadge({ type, className }: { type: LessonType; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-normal text-muted-foreground", className)}>
      {LESSON_TYPE_LABEL[type]}
    </Badge>
  );
}
