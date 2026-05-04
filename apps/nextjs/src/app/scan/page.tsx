import Link from "next/link";

import { Button } from "@klaro/ui/button";

import { SignInButton } from "../_components/sign-in-button";
import { DocumentsPanel } from "../_components/documents-panel";

import { getSession } from "~/auth/server";

import styles from "./page.module.css";

const scanCards = [
  {
    title: "Upload a file",
    body: "Drop a photo, scan, or PDF to begin extraction.",
  },
  {
    title: "Review the result",
    body: "Read the plain-language summary and flagged values before you act.",
  },
  {
    title: "Continue with care",
    body: "Move into chat, clinic search, or booking without losing context.",
  },
] as const;

const previewRows = [
  {
    label: "Glucose",
    value: "118 mg/dL",
    status: "Moderate",
  },
  {
    label: "Hemoglobin",
    value: "13.2 g/dL",
    status: "Normal",
  },
  {
    label: "Creatinine",
    value: "1.1 mg/dL",
    status: "Normal",
  },
] as const;

const analysisTags = ["Plain language", "Tagalog ready", "Guest safe", "Private link"] as const;

export default async function ScanPage() {
  const session = await getSession();

  return (
    <main className={styles.scan}>
      <div className={styles.scan__shell}>
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

        <section className={styles.scan__hero}>
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

              <Button asChild size="lg" variant="outline" className={styles.scan__secondaryAction}>
                <Link href="/login">Use the login page</Link>
              </Button>

              <Button asChild size="lg" variant="outline" className={styles.scan__secondaryAction}>
                <Link href="/">Return home</Link>
              </Button>
            </div>

            <div className={styles.scan__dropzone}>
              <span className={styles.scan__dropzoneLabel}>Drop target</span>
              <h2 className={styles.scan__dropzoneTitle}>Drop a PDF or image here.</h2>
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

          <aside className={styles.scan__preview}>
            <div className={styles.scan__previewHeader}>
              <span className={styles.scan__previewTitle}>Analysis preview</span>
              <span className={styles.scan__previewPill}>{session ? "active" : "guest"}</span>
            </div>

            <article className={styles.scan__summaryCard}>
              <span className={styles.scan__summaryLabel}>Plain-language read</span>
              <h2 className={styles.scan__summaryTitle}>
                One value is above target, but the rest stay in range.
              </h2>
              <p className={styles.scan__summaryCopy}>
                Klaro explains the flagged result in simple language and keeps the
                advice short enough to act on without losing context.
              </p>

              <div className={styles.scan__summaryTags}>
                {analysisTags.map((tag) => (
                  <span key={tag} className={styles.scan__summaryTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>

            <div className={styles.scan__results}>
              {previewRows.map((row) => (
                <div key={row.label} className={styles.scan__resultRow}>
                  <div>
                    <div className={styles.scan__resultLabel}>{row.label}</div>
                    <div className={styles.scan__resultValue}>{row.value}</div>
                  </div>
                  <span className={styles.scan__resultStatus}>{row.status}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.scan__grid}>
          {scanCards.map((card, index) => (
            <article key={card.title} className={styles.scan__card}>
              <span className={styles.scan__cardIndex}>0{index + 1}</span>
              <h2 className={styles.scan__cardTitle}>{card.title}</h2>
              <p className={styles.scan__cardCopy}>{card.body}</p>
            </article>
          ))}
        </section>

        <footer className={styles.scan__footer}>
          <span>Guest mode remains visible for quick scans and private sharing.</span>
          <span>Registered mode keeps saved analyses and follow-up context.</span>
        </footer>
      </div>
    </main>
  );
}