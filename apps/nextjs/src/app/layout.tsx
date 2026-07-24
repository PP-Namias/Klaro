import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";

import { cn } from "@klaro/ui";
import { ThemeProvider, ThemeToggle } from "@klaro/ui/theme";
import { Toaster } from "@klaro/ui/toast";

import { GlobalBookingModal } from "~/components/GlobalBookingModal";
import { LenisProvider } from "~/components/lenis-provider";
import { ScrollToTopButton } from "~/components/scroll-to-top-button";
import { env } from "~/env";
import { LanguageProvider } from "~/providers/language-provider";
import { TRPCReactProvider } from "~/trpc/react";

import "~/styles/globals.css";

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
    images: [
      {
        url: "/Klaro.png",
        width: 1200,
        height: 630,
        alt: "Klaro - AI-powered medical document assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@klarohealth",
    creator: "@klarohealth",
  },
  icons: {
    icon: "/klaro.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export default function RootLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen w-full max-w-[100vw] overflow-x-hidden antialiased",
          geist.className,
          cormorant.variable,
        )}
      >
        <ThemeProvider>
          <LanguageProvider>
            <LenisProvider>
              <TRPCReactProvider>
                {props.children}
                <GlobalBookingModal />
              </TRPCReactProvider>
              <div className="absolute right-4 bottom-4">
                <ThemeToggle />
              </div>
              <ScrollToTopButton />
              <Toaster />
            </LenisProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
