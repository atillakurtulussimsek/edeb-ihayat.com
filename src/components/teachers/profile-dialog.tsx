"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, UserCogIcon } from "lucide-react";
import { updateMyProfile } from "@/lib/actions/teachers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileDialog({ initial }: { initial: { name: string; phone: string } }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const r = await updateMyProfile(formData);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.message);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" variant="outline" />}>
        <UserCogIcon /> Profilim
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={submit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Profilim</DialogTitle>
            <DialogDescription>Şifre alanı boş bırakılırsa değişmez.</DialogDescription>
          </DialogHeader>
          <div className="my-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Ad Soyad</Label>
              <Input id="p-name" name="name" required defaultValue={initial.name} className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-phone">Telefon</Label>
                <Input id="p-phone" name="phone" type="tel" defaultValue={initial.phone} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-password">Yeni şifre</Label>
                <Input id="p-password" name="password" type="password" autoComplete="new-password" placeholder="Değiştirmek için yazın" className="h-10" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={pending} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {pending && <Loader2Icon className="animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
