import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[34rem] rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-live/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/10 font-heading text-lg font-semibold ring-1 ring-primary-foreground/20">E</span>
          <span className="font-heading text-xl">Edebi Hayat</span>
        </div>
        <div className="relative max-w-lg">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium ring-1 ring-primary-foreground/15">
            <span className="live-dot size-2 rounded-full bg-live" /> Canlı ders altyapısı · BigBlueButton
          </p>
          <h1 className="font-heading text-5xl leading-[1.05] font-medium tracking-tight">
            Metnin içinden geçen, <span className="text-brand italic">yüz yüze</span> bir ders deneyimi.
          </h1>
          <p className="mt-6 text-base/7 text-primary-foreground/70">
            Bireysel veya grup dersleri, ders takvimi ve kayıtlar tek yerde. Öğretmen odayı açar, öğrenci tek tıkla katılır.
          </p>
        </div>
        <ul className="relative flex flex-wrap gap-2 text-xs text-primary-foreground/70">
          {["Bireysel & grup dersleri", "Tüm dersler kaydedilir", "Beyaz tahta & ekran paylaşımı", "Tarayıcıdan katılım"].map((t) => (
            <li key={t} className="rounded-full px-3 py-1 ring-1 ring-primary-foreground/15">{t}</li>
          ))}
        </ul>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-heading text-2xl">Edebi Hayat</span>
          </div>
          <h2 className="font-heading text-3xl font-medium tracking-tight">Tekrar hoş geldiniz</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ders paneline erişmek için giriş yapın.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
