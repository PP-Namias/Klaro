"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

import styles from "../../app/page.module.css";

export function Navbar() {
  const [visible, setVisible] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<Record<string, string> | undefined>(undefined);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingUp = y < lastY.current;
      const pastThreshold = y > 80;

      // only control floating visibility
      setVisible(goingUp && pastThreshold);
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent)?.detail;
      setBookingPrefill(detail?.prefill);
      setIsBookingOpen(true);
    }

    globalThis.addEventListener('klaro:openBooking', handler as EventListener);
    return () => globalThis.removeEventListener('klaro:openBooking', handler as EventListener);
  }, []);

  return (
    <>
      {/* default transparent header */}
      <header className={styles.headerNav}>
        <Link href="/" className={styles.headerLogo}>
          <Image
            src="/klaro.svg"
            alt="Klaro Logo"
            width={38}
            height={38}
            className="mr-1"
            priority
          />
          Klaro
        </Link>
        <div className={styles.headerLinks}>
          <Link href="/scan" className={styles.headerLink}>
            Scan & Analyze
          </Link>
          <Link href="/maps" className={styles.headerLink}>
            Find a clinic
          </Link>
            {/* Open booking modal instead of navigating to /booking */}
            <button onClick={() => openBooking()} className={styles.headerLink}>
              Book a doctor
            </button>
          <Link href="/scan" className={styles.headerBtn}>
            Start a scan
            <ArrowRight size={14} className="ml-1 inline-block align-text-bottom" />
          </Link>
        </div>
      </header>

      {/* scroll-up floating pill header */}
      <div className={styles.floatingNavWrapper} data-visible={visible}>
        <header className={styles.floatingNav}>
          <Link href="/" className={styles.floatingLogo}>
            <Image
              src="/klaro-dark.svg"
              alt="Klaro Logo"
              width={30}
              height={30}
              className="mr-1"
            />
            Klaro
          </Link>
          <div className={styles.floatingLinks}>
            <Link href="/scan" className={styles.floatingLink}>
              Scan & Analyze
            </Link>
            <Link href="/maps" className={styles.floatingLink}>
              Find a clinic
            </Link>
            <button onClick={() => openBooking()} className={styles.floatingLink}>
              Book a doctor
            </button>
            <Link href="/scan" className={styles.floatingBtnBlack}>
              Start a scan
              <ArrowRight size={13} className="ml-1 inline-block align-text-bottom" />
            </Link>
          </div>
        </header>
      </div>
      {/* Booking modal (dynamically loaded) */}
      {isBookingOpen && (
        // dynamic import to avoid SSR for the modal
        <CalModalWrapper
          onClose={() => setIsBookingOpen(false)}
          open={isBookingOpen}
          prefill={bookingPrefill}
        />
      )}
    </>
  );
}

// Load CalModal client-side only
const CalModal = dynamic(() => import("../../components/CalModal"), {
  ssr: false,
});

function CalModalWrapper({
  open,
  onClose,
  prefill,
}: Readonly<{ open: boolean; onClose: () => void; prefill?: Record<string, string> }>) {
  return <CalModal open={open} onClose={onClose} prefill={prefill} />;
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

function openBooking(): void {
  // fetch session then open modal, fire analytics
  fetchSessionPrefill().then((prefill) => {
    try {
      if ((globalThis as any).analytics?.track) {
        (globalThis as any).analytics.track('booking_opened', { source: 'nav' });
      }
    } catch {}
    // set state via event to avoid hooks in this file scope
    // find the Navbar component instance state by dispatching a custom event
    globalThis.dispatchEvent(new CustomEvent('klaro:openBooking', { detail: { prefill } }));
  });
}
