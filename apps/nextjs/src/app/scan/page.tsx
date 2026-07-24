import React from "react";

import { ScannerNavbar } from "~/layouts/SampleScanner/ScannerNavbar";
import { Sidebar } from "~/layouts/SampleScanner/Sidebar";
import styles from "./page.module.css";
import { ScanPageClient } from "./scan-page-client";

export default function ScanPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <ScannerNavbar />
        <main className={styles.mainContent}>
          <React.Suspense
            fallback={
              <div
                style={{ padding: "2rem", textAlign: "center" }}
                aria-live="polite"
              >
                Loading...
              </div>
            }
          >
            <ScanPageClient />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
