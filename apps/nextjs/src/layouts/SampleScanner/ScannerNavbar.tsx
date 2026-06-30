"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { LanguageSelector } from "~/components/language-selector";
import styles from "../../app/scan/page.module.css";

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

export function ScannerNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <header className={styles.navbar}>
        <Link href="/" className={styles.navLogo}>
          <Image
            src="/klaro-dark.svg"
            alt="Klaro Logo"
            width={30}
            height={30}
            className="mr-1"
            priority
          />
          Klaro
        </Link>
        
        {/* Desktop Links */}
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/maps" className={styles.navLink}>
            Clinics and Hospitals
          </Link>
          <button onClick={openBooking} className={styles.navLink}>
            Book a Doctor
          </button>
          <LanguageSelector />
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className={styles.mobileMenuToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} color="#000" /> : <Menu size={24} color="#000" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileNavLinks}>
          <Link 
            href="/" 
            className={styles.mobileNavLink}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/maps" 
            className={styles.mobileNavLink}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Clinics and Hospitals
          </Link>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              openBooking();
            }} 
            className={styles.mobileNavLink}
          >
            Book a Doctor
          </button>
        </div>
      </div>
    </>
  );
}
