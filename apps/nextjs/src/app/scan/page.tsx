import { getSession } from "~/auth/server";
import { ScanGrid } from "~/layouts/Scan/ScanGrid";
import { ScanHeader } from "~/layouts/Scan/ScanHeader";
import { ScanHero } from "~/layouts/Scan/ScanHero";
import { ScanPreview } from "~/layouts/Scan/ScanPreview";
import styles from "./page.module.css";

export default async function ScanPage() {
  const session = await getSession();

  return (
    <main className={styles.scan}>
      <div className={styles.scan__shell}>
        <ScanHeader session={session} />

        <section className={styles.scan__hero}>
          <ScanHero session={session} />
          <ScanPreview session={session} />
        </section>

        <ScanGrid />

        <footer className={styles.scan__footer}>
          <span>
            Guest mode remains visible for quick scans and private sharing.
          </span>
          <span>
            Registered mode keeps saved analyses and follow-up context.
          </span>
        </footer>
      </div>
    </main>
  );
}
