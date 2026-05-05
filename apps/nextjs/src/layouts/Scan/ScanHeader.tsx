import Link from "next/link";
import { Button } from "@klaro/ui/button";
import styles from "../../app/scan/page.module.css";

interface ScanHeaderProps {
  session: any;
}

export function ScanHeader({ session }: ScanHeaderProps) {
  return (
    <header className={styles.scan__header}>
      <div className={styles.scan__brand}>
        <span className={styles.scan__brandMark}>K</span>
        <div className={styles.scan__brandText}>
          <span className={styles.scan__brandName}>Klaro scan</span>
          <span className={styles.scan__brandTag}>
            Intake and analysis preview in one calm workspace
          </span>
        </div>
      </div>

      <div className={styles.scan__actions}>
        {session ? (
          <div className={styles.scan__sessionChip}>
            <span className={styles.scan__sessionLabel}>Signed in as</span>
            <span className={styles.scan__sessionName}>
              {session.user.name ?? session.user.email ?? "Klaro member"}
            </span>
          </div>
        ) : null}

        <Button asChild size="lg" variant="outline" className={styles.scan__ghostAction}>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </header>
  );
}
