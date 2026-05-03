import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { GlobalShortcuts } from "@/components/layout/GlobalShortcuts";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/layout/SkipLink";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Inline theme-flash preventer. Runs synchronously before first paint to set the
 * `dark` class on <html> when the user prefers (or last selected) dark mode, so
 * the page never renders light then snap to dark on hydration. The `next-themes`
 * provider hydrates after this and reads the same `mlmap-theme` storage key.
 */
const themeFlashPreventer = `
try {
  var t = localStorage.getItem("mlmap-theme");
  if (!t) t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  if (t === "dark") document.documentElement.classList.add("dark");
} catch (e) {}
`;

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "MLMap — A PhD-grade learning map for modern AI",
    template: "%s · MLMap",
  },
  description:
    "Interactive ML/DL/AI curriculum from linear algebra to reasoning models, mixture-of-experts, state-space models, mechanistic interpretability, and JEPA.",
  applicationName: "MLMap",
  authors: [{ name: "MLMap" }],
  keywords: [
    "machine learning",
    "deep learning",
    "AI curriculum",
    "transformers",
    "diffusion",
    "interpretability",
    "JEPA",
    "interactive learning",
  ],
  openGraph: {
    title: "MLMap — A PhD-grade learning map for modern AI",
    description: "Master modern AI from first principles.",
    type: "website",
    siteName: "MLMap",
  },
  twitter: {
    card: "summary_large_image",
    title: "MLMap — A PhD-grade learning map for modern AI",
    description: "Master modern AI from first principles.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} antialiased`}
    >
      <head>
        {/* Static, build-time-known string — runs before first paint to set dark class. */}
        <script dangerouslySetInnerHTML={{ __html: themeFlashPreventer }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <SkipLink />
          <Nav />
          <main id="main" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <GlobalShortcuts />
        </Providers>
      </body>
    </html>
  );
}
