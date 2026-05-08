import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

import styles from "../../app/scan/page.module.css";

export function ScannerNavbar() {
  return (
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
      <div className={styles.navLinks}>
        <Link href="/" className={styles.navLink}>
          Home
        </Link>
        <Link href="/scan" className={styles.navLink}>
          Scan
        </Link>
        <Link href="/maps" className={styles.navLink}>
          Maps
        </Link>
        <Link href="/scan" className={styles.navSignInBtn}>
          Sign in
          <ArrowRight
            size={14}
            className="ml-1 inline-block align-text-bottom"
          />
        </Link>
      </div>
    </header>
  );
}
