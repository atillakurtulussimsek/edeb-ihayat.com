"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Sayfa görünürken belirli aralıkla sunucu verisini tazeler (ders durumları BBB ile eşitlenir). */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);
  return null;
}
