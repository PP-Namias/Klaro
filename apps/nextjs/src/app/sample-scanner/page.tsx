import Image from "next/image";
import { Sidebar } from "~/layouts/SampleScanner/Sidebar";
import { ScannerNavbar } from "~/layouts/SampleScanner/ScannerNavbar";
import { ScannerUI } from "~/layouts/SampleScanner/ScannerUI";
import styles from "./page.module.css";

export default function SampleScannerPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <ScannerNavbar />
        <main className={styles.mainContent}>
          <ScannerUI />
        </main>
      </div>
      <div className={styles.backgroundGlow}>
        <Image src="/scan-bg.svg" alt="Glow Background" fill style={{ objectFit: "cover", objectPosition: "bottom" }} priority />
      </div>
    </div>
  );
}
