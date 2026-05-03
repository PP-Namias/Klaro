import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@klaro/ui";
import { ThemeProvider, ThemeToggle } from "@klaro/ui/theme";
import { Toaster } from "@klaro/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://klaro.app"
      : "http://localhost:3000",
  ),
  title: "Klaro",
  description:
    "AI-powered medical document assistant with clinic discovery and consult booking",
  openGraph: {
    title: "Klaro",
    description:
      "Upload lab results, prescriptions, or discharge summaries and get clear guidance fast.",
    url: "https://klaro.app",
    siteName: "Klaro",
  },
  twitter: {
    card: "summary_large_image",
    site: "@klarohealth",
    creator: "@klarohealth",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
