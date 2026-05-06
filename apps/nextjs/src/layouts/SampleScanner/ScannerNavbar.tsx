import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";

import styles from "../../app/sample-scanner/page.module.css";

export function ScannerNavbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.navLogo}>
        <Image
          src="/klaro-dark.svg"
          alt="Klaro Logo"
          width={30}
          height={30}
          className="mr-1"
          priority
        />
        Klaro
      </div>
      <div className={styles.navLinks}>
        <a href="#" className={styles.navLink}>
          Home
        </a>
        <a href="#" className={styles.navLink}>
          Features
          <ChevronDown
            size={16}
            className="ml-1 inline-block align-text-bottom"
          />
        </a>
        <a href="#" className={styles.navLink}>
          Security
        </a>
        <button className={styles.navSignInBtn}>
          Sign in
          <ArrowRight
            size={14}
            className="ml-1 inline-block align-text-bottom"
          />
        </button>
      </div>
    </header>
  );
}
