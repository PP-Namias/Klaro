/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition */

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const CalModal = dynamic(() => import("./CalModal"), { ssr: false });

export function GlobalBookingModal() {
  // 1. Check initial hash on mount for deep linking
  const [isOpen, setIsOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.location.hash === "#booking=open",
  );
  const [prefill, setPrefill] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    // 2. Listen for custom open events
    const handleOpen = (e: CustomEvent<{ prefill?: Record<string, string> }>) => {
      setPrefill(e.detail?.prefill);
      setIsOpen(true);
      window.history.replaceState(null, "", "#booking=open");
    };

    const handleHashChange = () => {
      setIsOpen(window.location.hash === "#booking=open");
    };

    window.addEventListener("klaro:openBooking" as any, handleOpen);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("klaro:openBooking" as any, handleOpen);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Clear hash without reloading the page
    if (window.location.hash === "#booking=open") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  };

  return <CalModal open={isOpen} onClose={handleClose} prefill={prefill} />;
}