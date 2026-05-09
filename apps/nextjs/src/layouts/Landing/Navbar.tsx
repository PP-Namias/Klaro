"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import dynamic from "next/dynamic";

import styles from "./Navbar.module.css";

export function Navbar({ theme = "dark" }: { theme?: "dark" | "light" } = {}) {
  const [visible, setVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<Record<string, string> | undefined>(undefined);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingUp = y < lastY.current;
      const pastThreshold = y > 80;

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
      setIsMobileMenuOpen(false); // Close mobile menu if booking opens
    }

    globalThis.addEventListener('klaro:openBooking', handler as EventListener);
    return () => globalThis.removeEventListener('klaro:openBooking', handler as EventListener);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu automatically when screen is resized to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Default Transparent Header */}
      <header className={`${styles.navbar} ${theme === 'light' ? styles['navbar--light'] : ''}`}>
        <Link href="/" className={`${styles.navbar__brand} ${theme === 'dark' ? styles['navbar__brand--white'] : ''}`}>
          <Image src={theme === 'dark' ? "/klaro.svg" : "/klaro-dark.svg"} alt="Klaro Logo" width={38} height={38} priority />
          Klaro
        </Link>
        
        <div className={styles.navbar__links}>
          <Link href="/scan" className={styles.navbar__link}>Scan & Analyze</Link>
          <Link href="/maps" className={styles.navbar__link}>Clinics and Hospitals</Link>
          <button onClick={openBooking} className={styles.navbar__link}>Book a doctor</button>
          {/* <Link href="/scan" className={styles.navbar__btn}>
            Start a scan <ArrowRight size={14} className="ml-1 inline-block align-text-bottom" />
          </Link> */}
        </div>

        <button className={styles.navbar__toggle} onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* Scroll-Up Floating Header */}
      <header className={`${styles.navbar} ${styles['navbar--floating']} ${visible ? styles['navbar--visible'] : ''}`}>
        <Link href="/" className={styles.navbar__brand}>
          <Image src="/klaro-dark.svg" alt="Klaro Logo" width={30} height={30} />
          Klaro
        </Link>
        
        <div className={styles.navbar__links}>
          <Link href="/scan" className={styles.navbar__link}>Scan & Analyze</Link>
          <Link href="/maps" className={styles.navbar__link}>Find a clinic</Link>
          <button onClick={openBooking} className={styles.navbar__link}>Book a doctor</button>
          <Link href="/scan" className={styles.navbar__btn}>
            Start a scan <ArrowRight size={14} className="ml-1 inline-block align-text-bottom" />
          </Link>
        </div>

        <button className={styles.navbar__toggle} onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenu__header}>
            <Link href="/" className={styles.navbar__brand} onClick={() => setIsMobileMenuOpen(false)}>
              <Image src="/klaro-dark.svg" alt="Klaro Logo" width={30} height={30} />
              Klaro
            </Link>
            <button className={styles.navbar__toggle} onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className={styles.mobileMenu__links}>
            <Link href="/scan" className={styles.mobileMenu__link} onClick={() => setIsMobileMenuOpen(false)}>Scan & Analyze</Link>
            <Link href="/maps" className={styles.mobileMenu__link} onClick={() => setIsMobileMenuOpen(false)}>Find a clinic</Link>
            <button onClick={openBooking} className={styles.mobileMenu__link}>Book a doctor</button>
            <Link href="/scan" className={styles.navbar__btn} style={{ width: 'max-content', marginTop: '1rem' }} onClick={() => setIsMobileMenuOpen(false)}>
              Start a scan <ArrowRight size={14} className="ml-1 inline-block align-text-bottom" />
            </Link>
          </div>
        </div>
      )}

      {/* Booking Modal (Client Side) */}
      {isBookingOpen && (
        <CalModalWrapper
          onClose={() => setIsBookingOpen(false)}
          open={isBookingOpen}
          prefill={bookingPrefill}
        />
      )}
    </>
  );
}

// Dynamic load
const CalModal = dynamic(() => import("../../components/CalModal"), { ssr: false });

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
    return { name: data?.name || '', email: data?.email || '' };
  } catch {
    return undefined;
  }
}

function openBooking(): void {
  fetchSessionPrefill().then((prefill) => {
    try {
      if ((globalThis as any).analytics?.track) {
        (globalThis as any).analytics.track('booking_opened', { source: 'nav' });
      }
    } catch {}
    globalThis.dispatchEvent(new CustomEvent('klaro:openBooking', { detail: { prefill } }));
  });
}
