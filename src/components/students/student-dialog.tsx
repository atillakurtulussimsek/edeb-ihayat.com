"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { createStudent, updateStudent } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type StudentValues = { id: string; name: string; email: string; phone: string | null; note: string | null };

export function StudentDialog({
  student,
  open: controlledOpen,
  onOpenChange,
}: {
  student?: StudentValues;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [pending, start] = useTransition();
  const editing = Boolean(student);

  function submit(formData: FormData) {
    start(async () => {
      const r = student ? await updateStudent(student.id, formData) : await createStudent(formData);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message, { duration: r.message?.includes("Geçici şifre") ? 15000 : 4000 });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editing && (
        <DialogTrigger render={<Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90" />}>
          <PlusIcon /> Öğrenci ekle
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <form action={submit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editing ? "Öğrenciyi düzenle" : "Yeni öğrenci"}</DialogTitle>
            <DialogDescription>
              {editing ? "Bilgileri güncelleyin. Şifre alanı boş bırakılırsa değişmez." : "Şifre boş bırakılırsa geçici bir şifre üretilir."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Ad Soyad</Label>
              <Input id="s-name" name="name" required defaultValue={student?.name} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">E-posta</Label>
              <Input id="s-email" name="email" type="email" required defaultValue={student?.email} className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-phone">Telefon</Label>
                <Input id="s-phone" name="phone" type="tel" defaultValue={student?.phone ?? ""} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-password">{editing ? "Yeni şifre" : "Şifre"}</Label>
                <Input id="s-password" name="password" type="text" autoComplete="off" placeholder={editing ? "Değiştirmek için yazın" : "Boş bırakılabilir"} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-note">Not</Label>
              <Textarea id="s-note" name="note" rows={2} defaultValue={student?.note ?? ""} placeholder="Seviye, hedef, veli bilgisi…" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={pending} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {pending && <Loader2Icon className="animate-spin" />}
              {editing ? "Kaydet" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
