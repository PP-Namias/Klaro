"use client";

import React, { useEffect, useRef, useState } from "react";

import useFocusTrap from "./useFocusTrap";

export type CalModalProps = {
  open: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
  iframeTitle?: string;
  prefill?: Record<string, string>;
  onBooked?: () => void;
};

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
  const [loadIframe, setLoadIframe] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const focusTrapRef = useFocusTrap(dialogRef, open);
  const computedUrl = buildUrl(url, prefill);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      setLoadIframe(true);
      setIframeLoaded(false);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    } else {
      setLoadIframe(false);
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
    // Close modal when clicking directly on overlay (black background)
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).className?.includes?.("bg-black")
    ) {
      onClose();
    }
  };

  const onModalContentClick = (e: React.MouseEvent) => {
    // Prevent overlay click handler from triggering when clicking inside modal
    e.stopPropagation();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-modal-title"
      aria-describedby="cal-modal-desc"
      onClick={onOverlayClick}
      className="fixed inset-0 z-1200 flex items-end justify-center md:items-center"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      <div
        ref={(node) => {
          dialogRef.current = node;
          // @ts-ignore - ergonomic assignment
          focusTrapRef.current = node;
        }}
        onClick={onModalContentClick}
        className="relative z-1201 max-h-[85vh] w-full overflow-hidden rounded-t-lg bg-white shadow-xl md:w-[min(900px,95%)] md:rounded-lg"
        style={{ height: "85vh" }}
      >
        <div className="flex items-start justify-between border-b bg-white p-4">
          <div>
            <h2
              id="cal-modal-title"
              className="text-lg font-semibold text-black"
            >
              {title}
            </h2>
            <p id="cal-modal-desc" className="text-sm text-black">
              Schedule a secure session. Select a time that works for you.
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <a
              href={computedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-black hover:underline"
            >
              Open in new tab
            </a>
            <button
              aria-label="Close booking modal"
              onClick={onClose}
              className="ml-2 rounded p-1 hover:bg-gray-100 focus:ring focus:outline-none"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="relative h-full p-0">
          {!loadIframe && (
            <div className="flex h-full items-center justify-center p-6">
              <button
                onClick={() => setLoadIframe(true)}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Open booking
              </button>
            </div>
          )}

          {loadIframe && (
            <div className="h-full">
              {!iframeLoaded && (
                <div className="flex flex-col items-center justify-center gap-3 p-6">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <p className="text-sm text-black">
                    Loading scheduling tool — this may take a moment.
                  </p>
                </div>
              )}

              <div
                className={`h-[calc(85vh-96px)] w-full ${iframeLoaded ? "" : "hidden"}`}
              >
                <iframe
                  title={iframeTitle}
                  src={computedUrl}
                  onLoad={onIframeLoad}
                  className="h-full w-full border-0"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {!iframeLoaded && (
                <iframe
                  title={`${iframeTitle}-preload`}
                  src={computedUrl}
                  onLoad={onIframeLoad}
                  className="hidden"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
