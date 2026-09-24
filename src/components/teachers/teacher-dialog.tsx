"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { createTeacher } from "@/lib/actions/teachers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeacherDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const r = await createTeacher(formData);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90" />}>
        <PlusIcon /> Öğretmen ekle
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={submit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Yeni öğretmen</DialogTitle>
            <DialogDescription>Öğretmen kendi öğrencilerini ekleyip ders planlayabilir.</DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Ad Soyad</Label>
              <Input id="t-name" name="name" required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-email">E-posta</Label>
              <Input id="t-email" name="email" type="email" required className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-phone">Telefon</Label>
                <Input id="t-phone" name="phone" type="tel" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-password">Şifre</Label>
                <Input id="t-password" name="password" type="text" autoComplete="off" required minLength={6} className="h-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={pending} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {pending && <Loader2Icon className="animate-spin" />} Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
