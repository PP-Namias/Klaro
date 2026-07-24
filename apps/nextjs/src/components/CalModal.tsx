"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-empty */
import type React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

import useFocusTrap from "./useFocusTrap";

interface CalModalProps {
  open: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
  iframeTitle?: string;
  prefill?: Record<string, string>;
  onBooked?: () => void;
}

const DEFAULT_URL =
  "https://cal.com/pp-namias/1-hour-session-with-clara?embed=1&theme=light";
const SESSION_KEY = "SCAN_CAL_BOOKING";

function buildUrl(base: string, prefill?: Record<string, string>) {
  if (!prefill || Object.keys(prefill).length === 0) return base;
  try {
    const url = new URL(
      base,
      typeof window !== "undefined"
        ? window.location.origin
        : (undefined as any),
    );
    Object.entries(prefill).forEach(([k, v]) =>
      url.searchParams.set(k, String(v)),
    );
    return url.toString();
  } catch {
    return base;
  }
}

export default function CalModal({
  open,
  onClose,
  url = DEFAULT_URL,
  title = "Book a Doctor",
  iframeTitle = "Cal.com scheduling",
  prefill,
  onBooked,
}: CalModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<Element | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const focusTrapRef = useFocusTrap(dialogRef, open);
  const computedUrl = buildUrl(url, prefill);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      setIframeLoaded(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    } else {
      setIframeLoaded(false);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleBooked() {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ when: new Date().toISOString(), url: computedUrl }),
      );
    } catch {}
    if (
      (window as any).analytics &&
      typeof (window as any).analytics.track === "function"
    ) {
      try {
        (window as any).analytics.track("booking_completed", {
          source: "cal_modal",
        });
      } catch {}
    }
    onBooked?.();
    onClose();
  }

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      try {
        const originOk =
          typeof e.origin === "string" && e.origin.includes("cal.com");
        if (!originOk) return;
        const d = e.data || {};
        const isBooking =
          (d.type && /booking|event|created/i.test(String(d.type))) ||
          (d.event && /booking|created/i.test(String(d.event))) ||
          (d.data && d.data.object && /booking/i.test(String(d.data.object)));
        if (isBooking) handleBooked();
      } catch {}
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleBooked() {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ when: new Date().toISOString(), url: computedUrl }),
      );
    } catch {}
    if (
      (window as any).analytics &&
      typeof (window as any).analytics.track === "function"
    ) {
      try {
        (window as any).analytics.track("booking_completed", {
          source: "cal_modal",
        });
      } catch {}
    }
    onBooked?.();
    onClose();
  }

  const onIframeLoad = () => {
    setIframeLoaded(true);
  };

  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-modal-title"
          aria-describedby="cal-modal-desc"
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            role="presentation"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={(node) => {
              dialogRef.current = node;
              // @ts-expect-error - ref assignment for focus trap
              focusTrapRef.current = node;
            }}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[2001] flex w-full max-w-[1000px] flex-col overflow-hidden rounded-[28px] border border-white/40 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
            style={{ height: "min(720px, 80vh)" }}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-black/5 bg-transparent px-8 py-6">
              <div className="space-y-0.5">
                <h2
                  id="cal-modal-title"
                  className="font-cormorant text-2xl font-medium tracking-tight text-zinc-900 md:text-3xl"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  {title}
                </h2>
                <p
                  id="cal-modal-desc"
                  className="font-geist text-[0.9rem] text-zinc-500/80"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  Schedule a secure session at your convenience.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <a
                  href={computedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 md:flex"
                  style={{ fontFamily: "var(--font-geist)" }}
                >
                  <ExternalLink size={14} />
                  New tab
                </a>
                <button
                  aria-label="Close booking modal"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-zinc-500 transition-all hover:bg-black/10 hover:text-zinc-900 active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 overflow-hidden bg-transparent">
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -6, 0],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="h-full w-full">
                <iframe
                  title={iframeTitle}
                  src={computedUrl}
                  onLoad={onIframeLoad}
                  className="h-full w-full border-0"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{
                    opacity: iframeLoaded ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
