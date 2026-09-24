"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { setInitialPasswordAction, type ChangePasswordState, logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(setInitialPasswordAction, {});
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">Yeni şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="h-10" />
        <p className="text-xs text-muted-foreground">En az 8 karakter.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Yeni şifre (tekrar)</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="h-10" />
      </div>
      {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-10 w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {pending && <Loader2Icon className="animate-spin" />} Şifremi belirle ve devam et
      </Button>
      <button type="button" onClick={() => logoutAction()} className="w-full cursor-pointer text-center text-xs text-muted-foreground hover:text-foreground">
        Çıkış yap
      </button>
    </form>
  );
}
