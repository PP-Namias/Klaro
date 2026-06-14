import React from "react";

import { ScannerUI } from "~/layouts/SampleScanner/ScannerUI";
import { ScannerNavbar } from "~/layouts/SampleScanner/ScannerNavbar";
import { Sidebar } from "~/layouts/SampleScanner/Sidebar";
import styles from "./page.module.css";

export default function ScanPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <ScannerNavbar />
        <main className={styles.mainContent}>
          <React.Suspense
            fallback={
              <div style={{ padding: "2rem", textAlign: "center" }} aria-live="polite">
                Loading...
              </div>
            }
          >
            <ScannerUI />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
