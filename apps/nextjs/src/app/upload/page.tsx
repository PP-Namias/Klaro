import Link from "next/link";

import { Button } from "@klaro/ui/button";

import { SignInButton } from "../../components/sign-in-button";

import { getSession } from "~/auth/server";

import { UploadForm } from "./upload-form";
import styles from "./page.module.css";

const uploadSteps = [
  {
    title: "Choose a file",
    body: "Drop a PDF or image and keep the original order intact.",
  },
  {
    title: "Review the preview",
    body: "Confirm the correct page before you submit for analysis.",
  },
  {
    title: "Continue the care flow",
    body: "Move into chat, clinic search, or booking with the same context.",
  },
] as const;

const trustTags = [
  "private upload",
  "tagalog ready",
  "ocr queued",
  "shareable link",
] as const;

export default async function UploadPage() {
  const session = await getSession();

  return (
    <main className={styles.upload}>
      <div className={styles.upload__shell}>
        <header className={styles.upload__header}>
          <div className={styles.upload__brand}>
            <span className={styles.upload__brandMark}>K</span>
            <div className={styles.upload__brandText}>
              <span className={styles.upload__brandName}>Klaro upload</span>
              <span className={styles.upload__brandTag}>
                Secure intake for lab results and prescriptions
              </span>
            </div>
          </div>

          <div className={styles.upload__actions}>
            {session ? (
              <div className={styles.upload__sessionChip}>
                <span className={styles.upload__sessionLabel}>Signed in as</span>
                <span className={styles.upload__sessionName}>
                  {session.user.name ?? session.user.email ?? "Klaro member"}
                </span>
              </div>
            ) : null}

            <Button
              asChild
              size="lg"
              variant="outline"
              className={styles.upload__ghostAction}
            >
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </header>

        <section className={styles.upload__hero}>
          <div className={styles.upload__content}>
            <div className={styles.upload__intro}>
              <p className={styles.upload__eyebrow}>Document intake</p>
              <h1 className={styles.upload__title}>
                Upload once, then keep the analysis calm and readable.
              </h1>
              <p className={styles.upload__lede}>
                Klaro checks file quality early, protects the raw data, and
                keeps the next steps organized for patients and caregivers.
              </p>
            </div>

            <div className={styles.upload__ctaRow}>
              {session ? null : (
                <SignInButton className={styles.upload__primaryAction}>
                  Sign in to save history
                </SignInButton>
              )}

              <Button
                asChild
                size="lg"
                variant="outline"
                className={styles.upload__secondaryAction}
              >
                <Link href="/login">Use the login page</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className={styles.upload__secondaryAction}
              >
                <Link href="/scan">Review the scan flow</Link>
              </Button>
            </div>

            <UploadForm />
          </div>

          <aside className={styles.upload__aside}>
            <div className={styles.upload__asideHeader}>
              <span className={styles.upload__asideTitle}>Upload checklist</span>
              <span className={styles.upload__asidePill}>
                {session ? "member" : "guest"}
              </span>
            </div>

            <div className={styles.upload__asideCard}>
              <p className={styles.upload__asideLabel}>Before you send</p>
              <h2 className={styles.upload__asideHeading}>
                Confirm the file is readable and complete.
              </h2>
              <p className={styles.upload__asideCopy}>
                We recommend a clear photo or a single PDF page so the analysis
                remains accurate.
              </p>
              <div className={styles.upload__asideTags}>
                {trustTags.map((tag) => (
                  <span key={tag} className={styles.upload__asideTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.upload__grid}>
          {uploadSteps.map((step, index) => (
            <article key={step.title} className={styles.upload__card}>
              <span className={styles.upload__cardIndex}>0{index + 1}</span>
              <h2 className={styles.upload__cardTitle}>{step.title}</h2>
              <p className={styles.upload__cardCopy}>{step.body}</p>
            </article>
          ))}
        </section>

        <footer className={styles.upload__footer}>
          <span>Guest uploads generate private share links automatically.</span>
          <span>Registered users keep a secure history for follow-up care.</span>
        </footer>
      </div>
    </main>
  );
}
