import { Suspense } from "react";

import { Footer } from "~/layouts/Landing/Footer";
import { ScannerNavbar } from "~/layouts/SampleScanner/ScannerNavbar";
import FacilitiesClient from "~/components/facilities/FacilitiesClient";
import styles from "./page.module.css";

export const metadata = {
  title: "Medical Locations Map | Klaro",
  description:
    "Find nearby clinics and hospitals with smart filters and scan-aware recommendations.",
};

export default function MapsPage() {
  return (
    <div className={styles.pageContainer}>
      <ScannerNavbar />
      <main className={styles.mainContent}>
        <Suspense
          fallback={
            <div className="flex h-[60vh] w-full items-center justify-center bg-zinc-50">
              Loading map...
            </div>
          }
        >
          <FacilitiesClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
