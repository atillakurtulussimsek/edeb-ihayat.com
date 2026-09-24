"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ornek@eposta.com" className="h-10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-10" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-10 w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {pending && <Loader2Icon className="animate-spin" />}
        Giriş yap
      </Button>
      <p className="text-center text-xs text-muted-foreground">Hesabınız yoksa öğretmeninizden erişim isteyin.</p>
    </form>
  );
}
