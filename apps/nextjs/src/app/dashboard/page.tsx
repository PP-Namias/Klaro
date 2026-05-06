import Link from "next/link";

import { Button } from "@klaro/ui/button";

import { getSession } from "~/auth/server";
import { SignInButton } from "../../components/sign-in-button";
import styles from "./page.module.css";

const intakeCards = [
  {
    title: "Upload a new document",
    body: "Capture a lab result, prescription, or discharge summary and move into analysis.",
  },
  {
    title: "Continue the last case",
    body: "Pick up a saved result, review the plain-language summary, and keep context intact.",
  },
  {
    title: "Find a care path",
    body: "Jump from interpretation to nearby clinics, booking, and payment without losing state.",
  },
] as const;

const steps = [
  {
    label: "1. Select source",
    copy: "Photo, scan, or PDF.",
  },
  {
    label: "2. Read result",
    copy: "Get clear guidance in your dialect.",
  },
  {
    label: "3. Act",
    copy: "Book, pay, or share privately.",
  },
] as const;

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <main className={styles.dashboard}>
      <div className={styles.dashboard__shell}>
        <header className={styles.dashboard__header}>
          <div className={styles.dashboard__brand}>
            <span className={styles.dashboard__brandMark}>K</span>
            <div className={styles.dashboard__brandText}>
              <span className={styles.dashboard__brandName}>
                Klaro workspace
              </span>
              <span className={styles.dashboard__brandTag}>
                Intake, review, and care actions in one place
              </span>
            </div>
          </div>

          <div className={styles.dashboard__actions}>
            {session ? (
              <div className={styles.dashboard__sessionChip}>
                <span className={styles.dashboard__sessionLabel}>
                  Signed in as
                </span>
                <span className={styles.dashboard__sessionName}>
                  {session.user.name ?? session.user.email ?? "Klaro member"}
                </span>
              </div>
            ) : null}

            <Button
              asChild
              size="lg"
              variant="outline"
              className={styles.dashboard__ghostAction}
            >
              <Link href="/">Back to landing</Link>
            </Button>
          </div>
        </header>

        <section className={styles.dashboard__hero}>
          <div className={styles.dashboard__intro}>
            <div className="space-y-6">
              <p className={styles.dashboard__eyebrow}>Dashboard</p>
              <h1 className={styles.dashboard__title}>
                Start a new scan or continue a private case.
              </h1>
              <p className={styles.dashboard__lede}>
                Klaro keeps the medical document, explanation, and next step
                together. Guests can still scan with a private link. Registered
                users keep history, saved analyses, and a cleaner return path.
              </p>
            </div>

            <div className={styles.dashboard__ctaRow}>
              {session ? null : (
                <SignInButton className={styles.dashboard__primaryAction}>
                  Sign in to save history
                </SignInButton>
              )}

              <Button
                asChild
                size="lg"
                variant="outline"
                className={styles.dashboard__secondaryAction}
              >
                <Link href="/login">Use the login page</Link>
              </Button>
            </div>

            <div className={styles.dashboard__stats}>
              <article className={styles.dashboard__stat}>
                <span className={styles.dashboard__statValue}>scan</span>
                <span className={styles.dashboard__statLabel}>
                  ready for photo, scan, or PDF intake.
                </span>
              </article>
              <article className={styles.dashboard__stat}>
                <span className={styles.dashboard__statValue}>guest</span>
                <span className={styles.dashboard__statLabel}>
                  keep a visible guest mode for quick access.
                </span>
              </article>
              <article className={styles.dashboard__stat}>
                <span className={styles.dashboard__statValue}>history</span>
                <span className={styles.dashboard__statLabel}>
                  available once you sign in and opt in.
                </span>
              </article>
            </div>
          </div>

          <aside className={styles.dashboard__panel}>
            <div className={styles.dashboard__panelHeader}>
              <span className={styles.dashboard__panelTitle}>Quick intake</span>
              <span className={styles.dashboard__panelPill}>
                {session ? "active" : "guest"}
              </span>
            </div>

            <article className={styles.dashboard__fileCard}>
              <span className={styles.dashboard__fileLabel}>Next action</span>
              <h2 className={styles.dashboard__fileTitle}>
                Upload a document to start the analysis flow.
              </h2>
              <p className={styles.dashboard__fileCopy}>
                The same intake path supports a first-time scan, a follow-up
                review, or a guest-only private link.
              </p>
              <div className={styles.dashboard__fileMeta}>
                <span className={styles.dashboard__fileTag}>Private</span>
                <span className={styles.dashboard__fileTag}>Dialects</span>
                <span className={styles.dashboard__fileTag}>Bookable</span>
              </div>
            </article>

            <div className={styles.dashboard__steps}>
              {steps.map((step) => (
                <div key={step.label} className={styles.dashboard__step}>
                  <div className={styles.dashboard__stepLabel}>
                    {step.label}
                  </div>
                  <div className={styles.dashboard__stepCopy}>{step.copy}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.dashboard__grid}>
          {intakeCards.map((card, index) => (
            <article key={card.title} className={styles.dashboard__card}>
              <span className={styles.dashboard__cardIndex}>0{index + 1}</span>
              <h2 className={styles.dashboard__cardTitle}>{card.title}</h2>
              <p className={styles.dashboard__cardCopy}>{card.body}</p>
            </article>
          ))}
        </section>

        <footer className={styles.dashboard__footer}>
          <span>Guest mode stays visible for fast scans.</span>
          <span>Registered mode unlocks history and saved context.</span>
        </footer>
      </div>
    </main>
  );
}
