"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  DownloadIcon, ExternalLinkIcon, FileIcon, FileTextIcon, ImageIcon, Loader2Icon, PaperclipIcon,
  PresentationIcon, Trash2Icon, UploadCloudIcon, VideoIcon, MusicIcon, FileArchiveIcon, type LucideIcon,
} from "lucide-react";
import { deleteMaterial, uploadMaterials } from "@/lib/actions/materials";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MaterialItem = { id: string; name: string; mimeType: string; size: number; createdAt: Date };

function iconFor(mime: string): LucideIcon {
  if (mime === "application/pdf") return FileTextIcon;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return VideoIcon;
  if (mime.startsWith("audio/")) return MusicIcon;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return PresentationIcon;
  if (mime.includes("zip")) return FileArchiveIcon;
  if (mime.includes("word") || mime.startsWith("text/")) return FileTextIcon;
  return FileIcon;
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const previewable = (mime: string) => /^(application\/pdf|image\/|video\/|audio\/)/.test(mime);

export function MaterialsPanel({ lessonId, materials, isTeacher }: { lessonId: string; materials: MaterialItem[]; isTeacher: boolean }) {
  const [pending, start] = useTransition();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    const fd = new FormData();
    list.forEach((f) => fd.append("files", f));
    start(async () => {
      const r = await uploadMaterials(lessonId, fd);
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove(m: MaterialItem) {
    if (!confirm(`"${m.name}" silinsin mi?`)) return;
    start(async () => {
      const r = await deleteMaterial(m.id);
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  }

  return (
    <section className="paper-card rounded-2xl p-5 ring-1 ring-foreground/8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg"><PaperclipIcon className="size-4" /> Materyaller</h2>
        <span className="text-xs text-muted-foreground">{materials.length} dosya</span>
      </div>

      {isTeacher && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragging ? "border-brand bg-accent/50" : "border-border hover:bg-muted/50",
            pending && "pointer-events-none opacity-60"
          )}
        >
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => e.target.files && upload(e.target.files)} />
          {pending ? <Loader2Icon className="size-5 animate-spin text-brand" /> : <UploadCloudIcon className="size-5 text-brand" />}
          <span className="text-sm font-medium">{pending ? "Yükleniyor…" : "Dosya sürükleyin veya seçin"}</span>
          <span className="text-xs text-muted-foreground">PDF, sunum, Word, görsel, ses/video · en fazla 20 MB</span>
        </label>
      )}

      {materials.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{isTeacher ? "Henüz materyal eklenmedi." : "Bu ders için materyal paylaşılmadı."}</p>
      ) : (
        <ul className="mt-4 divide-y">
          {materials.map((m) => {
            const Icon = iconFor(m.mimeType);
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-4" /></span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtSize(m.size)} · {fmtDateTime(m.createdAt)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {previewable(m.mimeType) && (
                    <Button variant="ghost" size="icon-sm" aria-label="Önizle" render={<a href={`/api/materials/${m.id}?inline=1`} target="_blank" rel="noopener noreferrer" />}>
                      <ExternalLinkIcon />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label="İndir" render={<a href={`/api/materials/${m.id}`} download={m.name} />}>
                    <DownloadIcon />
                  </Button>
                  {isTeacher && (
                    <Button variant="ghost" size="icon-sm" aria-label="Sil" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => remove(m)}>
                      <Trash2Icon />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
