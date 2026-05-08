"use client";

import Image from "next/image";
import Link from "next/link";

import { MARKETING_FOOTER_GROUPS } from "~/content/marketing-pages";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white px-4 py-3 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[980px] flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-950">
            <Image src="/klaro-dark.svg" alt="Klaro" width={24} height={24} />
            <span className="text-sm font-medium">Klaro</span>
          </Link>

          <Link href="/scan" className="inline-flex items-center justify-center rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
            Start a scan
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-zinc-600 md:grid-cols-3">
          {MARKETING_FOOTER_GROUPS.slice(0, 3).map((group) => (
            <div key={group.title}>
              <h4 className="mb-1 text-[0.65rem] font-semibold text-zinc-900">{group.title}</h4>
              <nav className="flex flex-col gap-1">
                {group.links.map((link) => {
                  if (link.href === "/booking") {
                    return (
                      <button
                        key={link.label}
                        onClick={() => openBookingFromFooter()}
                        className="text-xs text-zinc-600 transition-colors hover:text-zinc-900 text-left"
                      >
                        {link.label}
                      </button>
                    );
                  }

                  return (
                    <Link key={link.label} href={link.href} className="text-xs text-zinc-600 hover:text-zinc-900">
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center justify-between text-[0.65rem] text-zinc-500">
          <p>© 2026 Klaro.</p>
          <div className="flex items-center gap-3">
            <Link href="https://github.com/PP-Namias/Klaro" target="_blank" rel="noreferrer" aria-label="Klaro on GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.46-1.12-1.46-.91-.62.07-.61.07-.61 1.01.07 1.55 1.04 1.55 1.04.9 1.54 2.37 1.1 2.95.84.09-.65.35-1.1.64-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0112 6.82c.85 0 1.7.11 2.5.33 1.9-1.3 2.74-1.02 2.74-1.02.55 1.38.2 2.39.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .26.18.57.69.47A10 10 0 0012 2z" />
              </svg>
            </Link>
            <Link href="https://www.facebook.com/profile.php?id=61589428109759" target="_blank" rel="noreferrer" aria-label="Klaro on Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

async function fetchSessionPrefill() {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return undefined;
    const data = await res.json();
    return {
      name: data?.name || '',
      email: data?.email || '',
    };
  } catch {
    return undefined;
  }
}

function openBookingFromFooter(): void {
  fetchSessionPrefill().then((prefill) => {
    try {
      if ((globalThis as any).analytics?.track) {
        (globalThis as any).analytics.track('booking_opened', { source: 'footer' });
      }
    } catch {}
    globalThis.dispatchEvent(new CustomEvent('klaro:openBooking', { detail: { prefill } }));
  });
}
