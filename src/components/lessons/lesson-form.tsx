"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, SearchIcon } from "lucide-react";
import type { LessonType } from "@/generated/prisma/client";
import { createLesson, updateLesson } from "@/lib/actions/lessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VideoIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type StudentOption = { id: string; name: string; email: string };

export type LessonFormValues = {
  id?: string;
  title: string;
  description: string;
  type: LessonType;
  startsAt: string;
  durationMin: number;
  studentIds: string[];
};

const DURATIONS = [30, 45, 60, 90, 120];

export function LessonForm({ students, initial }: { students: StudentOption[]; initial: LessonFormValues }) {
  const [type, setType] = useState<LessonType>(initial.type);
  const [selected, setSelected] = useState<string[]>(initial.studentIds);
  const [duration, setDuration] = useState(initial.durationMin);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return q ? students.filter((s) => `${s.name} ${s.email}`.toLocaleLowerCase("tr").includes(q)) : students;
  }, [students, query]);

  function toggle(id: string) {
    if (type === "INDIVIDUAL") {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function changeType(next: LessonType) {
    setType(next);
    if (next === "INDIVIDUAL" && selected.length > 1) setSelected(selected.slice(0, 1));
  }

  function submit(formData: FormData) {
    formData.set("type", type);
    formData.set("durationMin", String(duration));
    formData.delete("studentIds");
    selected.forEach((id) => formData.append("studentIds", id));
    start(async () => {
      const r = initial.id ? await updateLesson(initial.id, formData) : await createLesson(formData);
      if (r && !r.ok) toast.error(r.error);
      else if (r?.ok) toast.success(r.message);
    });
  }

  return (
    <form action={submit} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <fieldset className="space-y-2">
          <Label>Ders türü</Label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {(["INDIVIDUAL", "GROUP"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => changeType(t)}
                className={cn(
                  "cursor-pointer rounded-xl border p-4 text-left transition-colors",
                  type === t ? "border-brand bg-accent/60 ring-2 ring-brand/30" : "hover:bg-muted"
                )}
              >
                <div className="font-medium">{t === "INDIVIDUAL" ? "Bireysel" : "Grup"}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t === "INDIVIDUAL" ? "Tek öğrenciyle birebir ders" : "Birden fazla öğrenciyle ders"}
                </div>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="title">Ders adı</Label>
          <Input id="title" name="title" required defaultValue={initial.title} placeholder="Örn. Divan Şiiri – Fuzûlî" className="h-10" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startsAt">Tarih ve saat</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue={initial.startsAt} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Süre</Label>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  aria-pressed={duration === d}
                  className={cn(
                    "h-10 cursor-pointer rounded-lg border px-3 text-sm transition-colors",
                    duration === d ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {d} dk
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama <span className="font-normal text-muted-foreground">(isteğe bağlı)</span></Label>
          <Textarea id="description" name="description" rows={3} defaultValue={initial.description} placeholder="Konu başlıkları, ödevler, hazırlık notları…" />
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-accent/50 p-4 text-accent-foreground">
          <VideoIcon className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="text-sm font-medium">Tüm dersler kaydedilir</div>
            <div className="text-xs opacity-80">Kayıt ders başladığında otomatik başlar ve ders bittikten sonra Kayıtlar sayfasında görünür.</div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 ring-1 ring-foreground/8">
        <div className="flex items-center justify-between">
          <Label>{type === "INDIVIDUAL" ? "Öğrenci" : "Öğrenciler"}</Label>
          <span className="text-xs text-muted-foreground">{selected.length} seçili</span>
        </div>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Öğrenci ara" className="h-9 bg-background pl-8" />
        </div>
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {filtered.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">Öğrenci bulunamadı.</li>}
          {filtered.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <li key={s.id}>
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-background", checked && "bg-background ring-1 ring-brand/30")}>
                  <Checkbox checked={checked} onCheckedChange={() => toggle(s.id)} />
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <Button type="submit" disabled={pending || selected.length === 0} className="mt-2 h-10 bg-brand text-brand-foreground hover:bg-brand/90">
          {pending && <Loader2Icon className="animate-spin" />}
          {initial.id ? "Değişiklikleri kaydet" : "Dersi planla"}
        </Button>
      </aside>
    </form>
  );
}
