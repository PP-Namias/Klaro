"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

import styles from "../../app/page.module.css";

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
          <a href="#" className={styles.headerLink}>
            Home
          </a>
          <a href="#" className={styles.headerLink}>
            Features
            <ChevronDown
              size={16}
              className="ml-1 inline-block align-text-bottom"
            />
          </a>
          <a href="#" className={styles.headerLink}>
            Security
          </a>
          <Link href="/login?auto=1" className={styles.headerBtn}>
            Sign in
            <ArrowRight
              size={14}
              className="ml-1 inline-block align-text-bottom"
            />
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
            <a href="#" className={styles.floatingLink}>
              Home
            </a>
            <a href="#" className={styles.floatingLink}>
              Features
              <ChevronDown
                size={14}
                className="ml-1 inline-block align-text-bottom"
              />
            </a>
            <a href="#" className={styles.floatingLink}>
              Security
            </a>
            <Link href="/login?auto=1" className={styles.floatingBtnBlack}>
              Sign in
              <ArrowRight
                size={13}
                className="ml-1 inline-block align-text-bottom"
              />
            </Link>
          </div>
        </header>
      </div>
    </>
  );
}
