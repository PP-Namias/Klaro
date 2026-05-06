import Image from "next/image";
import { ChevronDown, ArrowRight } from "lucide-react";
import styles from "../../app/sample-scanner/page.module.css";

export function ScannerNavbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.navLogo}>
        <Image src="/klaro.svg" alt="Klaro Logo" width={28} height={28} priority className={styles.navLogoImage} />
        <span style={{ fontSize: '1.75rem', fontWeight: 400 }}>Klaro</span>
      </div>
      <div className={styles.navLinks}>
        <a href="#" className={styles.navLink}>Home</a>
        <a href="#" className={styles.navLink}>
          Features <ChevronDown size={14} className="inline-block ml-1 align-text-bottom" />
        </a>
        <a href="#" className={styles.navLink}>Security</a>
        <a href="#" className={styles.navLink}>
          Blog <ChevronDown size={14} className="inline-block ml-1 align-text-bottom" />
        </a>
        <button className={styles.navSignInBtn}>
          Sign in <ArrowRight size={14} className="inline-block ml-1 align-text-bottom" />
        </button>
      </div>
    </header>
  );
}
