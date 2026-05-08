import Image from "next/image";
import Link from "next/link";

import { MARKETING_FOOTER_GROUPS } from "~/content/marketing-pages";

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-zinc-200 bg-white px-6 py-10 text-zinc-900 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_32%)]" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="flex h-full flex-col justify-between gap-5 rounded-[28px] border border-zinc-200 bg-zinc-50/80 p-6 shadow-[0_10px_28px_rgba(0,0,0,0.03)] backdrop-blur-sm">
            <Link href="/" className="inline-flex items-center gap-3 text-zinc-950">
              <Image src="/klaro-dark.svg" alt="Klaro" width={32} height={32} priority />
              <span className="feature-small-title text-zinc-950">Klaro</span>
            </Link>

            <div className="max-w-xl space-y-3">
              <p className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-1 text-[0.7rem] uppercase tracking-[0.26em] text-zinc-500">
                Built for the Philippines
              </p>
              <h2 className="section-header text-balance text-zinc-950">
                Clear health guidance, without the fluff.
              </h2>
              <p className="feature-card-description max-w-lg text-zinc-600">
                Scan, understand, and move to the next step with less noise.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Start a scan
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
                Private documents
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
                Philippines-first care
              </span>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.03)]">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MARKETING_FOOTER_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-3">
                  <h3 className="feature-small-title text-zinc-950">
                    {group.title}
                  </h3>
                  <nav className="flex flex-col gap-2.5">
                    {group.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="feature-small-desc text-zinc-600 transition-colors hover:text-zinc-950"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Klaro. Built for the Philippines.</p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="https://github.com/PP-Namias/Klaro"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-zinc-950"
              aria-label="Klaro on GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.46-1.12-1.46-.91-.62.07-.61.07-.61 1.01.07 1.55 1.04 1.55 1.04.9 1.54 2.37 1.1 2.95.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0112 6.82c.85 0 1.7.11 2.5.33 1.9-1.3 2.74-1.02 2.74-1.02.55 1.38.2 2.39.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .26.18.57.69.47A10 10 0 0012 2z" />
              </svg>
              GitHub
            </Link>
            <Link
              href="https://www.facebook.com/profile.php?id=61589428109759"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-zinc-950"
              aria-label="Klaro on Facebook"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
              Facebook
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
