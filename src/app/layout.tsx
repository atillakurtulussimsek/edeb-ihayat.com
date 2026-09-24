import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: { default: "Edebi Hayat", template: "%s · Edebi Hayat" },
  description: "Canlı online ders platformu",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{THEME_INIT_SCRIPT}</Script>
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
