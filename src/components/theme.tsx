"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "theme";
const ThemeContext = createContext<{ theme: Theme; resolvedTheme: Resolved; setTheme: (t: Theme) => void } | null>(null);

/** <head> içinde, hidrasyondan önce çalışır: yanıp sönmeyi önler. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement;c.classList.toggle("dark",d);c.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

function resolve(t: Theme): Resolved {
  if (t !== "system") return t;
  return typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(r: Resolved) {
  const c = document.documentElement;
  c.classList.toggle("dark", r === "dark");
  c.style.colorScheme = r;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    let stored: Theme = "system";
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark" || v === "system") stored = v;
    } catch {}
    setThemeState(stored);
    setResolved(resolve(stored));

    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      setThemeState((cur) => {
        if (cur === "system") {
          const r = resolve("system");
          apply(r);
          setResolved(r);
        }
        return cur;
      });
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
    setThemeState(t);
    const r = resolve(t);
    apply(r);
    setResolved(r);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme, ThemeProvider içinde kullanılmalı.");
  return ctx;
}
