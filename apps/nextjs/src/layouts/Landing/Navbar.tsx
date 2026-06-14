"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import styles from "../../app/page.module.css";

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
    window.dispatchEvent(new CustomEvent('klaro:openBooking', { detail: { prefill } }));
  });
}

export function Navbar({ theme = "dark" }: { theme?: "dark" | "light" } = {}) {
  const [visible, setVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <>
      {/* default transparent header */}
      <header className={styles.headerNav}>
        <Link href="/" className={styles.headerLogo}>
          <Image
            src={theme === "light" ? "/klaro-dark.svg" : "/klaro.svg"}
            alt="Klaro Logo"
            width={38}
            height={38}
            className="mr-1"
            priority
          />
          <span className={theme === "light" ? "text-zinc-900" : "text-white"}>Klaro</span>
        </Link>
        <div className={styles.headerLinks}>
          <Link href="/scan" className={styles.headerLink}>
            Scan & Analyze
          </Link>
          <Link href="/maps" className={styles.headerLink}>
            Clinics and Hospitals
          </Link>
          <button onClick={openBooking} className={styles.headerLink}>
            Book a doctor
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="flex md:hidden" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className={theme === "light" ? "text-zinc-900" : "text-white"} size={28} />
          ) : (
            <Menu className={theme === "light" ? "text-zinc-900" : "text-white"} size={28} />
          )}
        </button>
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
              Clinics and Hospitals
            </Link>
            <button onClick={openBooking} className={styles.floatingLink}>
              Book a doctor
            </button>
          </div>
          <button 
            className="flex md:hidden" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="text-zinc-900" size={24} /> : <Menu className="text-zinc-900" size={24} />}
          </button>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-white p-8 md:hidden">
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
              <Image src="/klaro-dark.svg" alt="Klaro" width={32} height={32} />
              Klaro
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X size={32} className="text-zinc-900" />
            </button>
          </div>
          <nav className="flex flex-col gap-8">
            <Link href="/scan" className="text-2xl font-medium text-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
              Scan & Analyze
            </Link>
            <Link href="/maps" className="text-2xl font-medium text-zinc-900" onClick={() => setIsMobileMenuOpen(false)}>
              Clinics and Hospitals
            </Link>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                openBooking();
              }} 
              className="text-left text-2xl font-medium text-zinc-900"
            >
              Book a doctor
            </button>
          </nav>
          <div className="mt-auto">
            <Link 
              href="/scan" 
              className="flex w-full items-center justify-center rounded-full bg-black py-4 text-lg font-medium text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Start a scan <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
