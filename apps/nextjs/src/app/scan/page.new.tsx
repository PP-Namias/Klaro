import React from "react";
import Image from "next/image";

import { ScanContainer } from "~/components/scan-container";
import { ScannerNavbar } from "~/layouts/SampleScanner/ScannerNavbar";
import { Sidebar } from "~/layouts/SampleScanner/Sidebar";
import styles from "./page.tsx.module.css";

export default function ScanPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <ScannerNavbar />
        <main className={styles.mainContent}>
          <React.Suspense
            fallback={
              <div style={{ padding: "2rem", textAlign: "center" }}>
                Loading...
              </div>
            }
          >
            <ScanContainer />
          </React.Suspense>
        </main>
      </div>
      <div className={styles.backgroundGlow}>
        <Image
          src="/scan-bg.svg"
          alt="Glow Background"
          fill
          style={{ objectFit: "cover", objectPosition: "bottom" }}
          priority
        />
      </div>
    </div>
  );
}
