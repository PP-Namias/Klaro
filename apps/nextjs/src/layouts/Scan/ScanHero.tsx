import Link from "next/link";

import { Button } from "@klaro/ui/button";

import styles from "../../app/scan/page.module.css";
import { DocumentsPanel } from "../../components/documents-panel";
import { SignInButton } from "../../components/sign-in-button";

interface ScanHeroProps {
  session: any;
}

export function ScanHero({ session }: ScanHeroProps) {
  return (
    <div className={styles.scan__intake}>
      <div className="space-y-6">
        <p className={styles.scan__eyebrow}>Document intake</p>
        <h1 className={styles.scan__title}>
          Upload a medical document and see the first read immediately.
        </h1>
        <p className={styles.scan__lede}>
          Klaro keeps the upload flow simple, then presents the analysis in a
          way that feels clinical, careful, and easy to continue from.
        </p>
      </div>

      <div className={styles.scan__ctaRow}>
        {session ? null : (
          <SignInButton className={styles.scan__primaryAction}>
            Sign in to save history
          </SignInButton>
        )}

        <Button
          asChild
          size="lg"
          variant="outline"
          className={styles.scan__secondaryAction}
        >
          <Link href="/login">Use the login page</Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className={styles.scan__secondaryAction}
        >
          <Link href="/">Return home</Link>
        </Button>
      </div>

      <div className={styles.scan__dropzone}>
        <span className={styles.scan__dropzoneLabel}>Drop target</span>
        <h2 className={styles.scan__dropzoneTitle}>
          Drop a PDF or image here.
        </h2>
        <p className={styles.scan__dropzoneCopy}>
          The real upload action can sit here later. For now, this page shows
          the calm intake and preview structure Klaro will use.
        </p>
        <div className={styles.scan__dropzoneTags}>
          <span className={styles.scan__dropzoneTag}>PNG</span>
          <span className={styles.scan__dropzoneTag}>JPG</span>
          <span className={styles.scan__dropzoneTag}>PDF</span>
          <span className={styles.scan__dropzoneTag}>Private</span>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <DocumentsPanel />
        </div>
      </div>
    </div>
  );
}
