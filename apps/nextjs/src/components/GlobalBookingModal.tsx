/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition */

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const CalModal = dynamic(() => import("./CalModal"), { ssr: false });

export function GlobalBookingModal() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<
    Record<string, string> | undefined
  >(undefined);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent)?.detail;
      setBookingPrefill(detail?.prefill);
      setIsBookingOpen(true);
    }

    window.addEventListener("klaro:openBooking", handler as EventListener);
    return () =>
      window.removeEventListener("klaro:openBooking", handler as EventListener);
  }, []);

  if (!isBookingOpen) return null;

  return (
    <CalModal
      open={isBookingOpen}
      onClose={() => setIsBookingOpen(false)}
      prefill={bookingPrefill}
    />
  );
}
