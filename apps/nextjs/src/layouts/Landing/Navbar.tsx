import Image from "next/image";
import { ChevronDown, ArrowRight } from "lucide-react";
import styles from "../../app/sample-landing/page.module.css";

export function Navbar() {
  return (
    <header className={styles.headerNav}>
      <div className={styles.headerLogo}>
        <Image
          src="/klaro.svg"
          alt="Klaro Logo"
          width={32}
          height={32}
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
        <a href="#" className={styles.headerLink}>
          Blog 
          <ChevronDown size={16} className="inline-block ml-1 align-text-bottom" />
        </a>
        <button className={styles.headerBtn}>
          Sign in 
          <ArrowRight size={14} className="inline-block ml-1 align-text-bottom" />
        </button>
      </div>
    </header>
  );
}
