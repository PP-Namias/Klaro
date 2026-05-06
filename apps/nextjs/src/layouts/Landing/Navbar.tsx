"use client";

import Image from "next/image";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "../../app/sample-landing/page.module.css";

export function Navbar() {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingUp = y < lastY.current;
      const pastThreshold = y > 80;

      setScrolled(pastThreshold && goingUp);
      setVisible(goingUp && pastThreshold);
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* default transparent header */}
      <header className={styles.headerNav}>
        <div className={styles.headerLogo}>
          <Image
            src="/klaro.svg"
            alt="Klaro Logo"
            width={38}
            height={38}
            className="mr-1"
            priority
          />
          Klaro
        </div>
        <div className={styles.headerLinks}>
          <a href="#" className={styles.headerLink}>Home</a>
          <a href="#" className={styles.headerLink}>
            Features
            <ChevronDown size={16} className="inline-block ml-1 align-text-bottom" />
          </a>
          <a href="#" className={styles.headerLink}>Security</a>
          <button className={styles.headerBtn}>
            Sign in
            <ArrowRight size={14} className="inline-block ml-1 align-text-bottom" />
          </button>
        </div>
      </header>

      {/* scroll-up floating pill header */}
      <div className={styles.floatingNavWrapper} data-visible={visible}>
        <header className={styles.floatingNav}>
          <div className={styles.floatingLogo}>
            <Image src="/klaro-dark.svg" alt="Klaro Logo" width={30} height={30} className="mr-1" />
            Klaro
          </div>
          <div className={styles.floatingLinks}>
            <a href="#" className={styles.floatingLink}>Home</a>
            <a href="#" className={styles.floatingLink}>
              Features
              <ChevronDown size={14} className="inline-block ml-1 align-text-bottom" />
            </a>
            <a href="#" className={styles.floatingLink}>Security</a>
            <button className={styles.floatingBtnBlack}>
              Sign in
              <ArrowRight size={13} className="inline-block ml-1 align-text-bottom" />
            </button>
          </div>
        </header>
      </div>
    </>
  );
}
