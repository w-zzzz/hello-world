"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { LenisProvider } from "@/components/apple/LenisProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <LenisProvider>{children}</LenisProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-[var(--color-card)] !text-[var(--color-fg)] !border-[var(--color-border)]",
        }}
      />
    </ThemeProvider>
  );
}
