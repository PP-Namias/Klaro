import Link from "next/link";

import { Button } from "@klaro/ui/button";

import { SignInButton } from "./_components/sign-in-button";

import styles from "./page.module.css";

const features = [
  {
    title: "Scan with confidence",
    body: "Photo, scan, or PDF upload with clear preprocessing and review-ready output.",
  },
  {
    title: "Explain in plain language",
    body: "Flagged values, severity cues, and bedside wording in Filipino dialects.",
  },
  {
    title: "Move straight to care",
    body: "Clinic discovery, doctor booking, and payments live in one guided flow.",
  },
] as const;

const workflow = [
  {
    label: "1. Upload",
    copy: "Capture a page or drop a PDF.",
  },
  {
    label: "2. Read",
    copy: "Get a plain-language explanation.",
  },
  {
    label: "3. Act",
    copy: "Find a clinic or book a doctor.",
  },
] as const;

export default function HomePage() {
  return (
    <main className={styles.landing}>
      <div className={styles.landing__shell}>
        <header className={styles.landing__nav}>
          <div className={styles.landing__brand}>
            <span className={styles.landing__brandMark}>K</span>
            <div className={styles.landing__brandText}>
              <span className={styles.landing__brandName}>Klaro</span>
              <span className={styles.landing__brandTag}>
                Plain-language health guidance for the Philippines
              </span>
            </div>
          </div>

          <div className={styles.landing__navActions}>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={styles.landing__ghostLink}
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </header>

        <section className={styles.landing__hero}>
          <div className={styles.landing__copy}>
            <div className="space-y-6">
              <p className={styles.landing__eyebrow}>Health documents, clarified</p>
              <h1 className={styles.landing__title}>
                Understand your results before they overwhelm you.
              </h1>
              <p className={styles.landing__lede}>
                Klaro turns lab results, prescriptions, and discharge summaries
                into clear next steps. Keep the conversation in Filipino,
                Bisaya, or Ilocano, then move into clinic search, doctor
                booking, and payment without losing context.
              </p>
            </div>

            <div className={styles.landing__actions}>
              <SignInButton className={styles.landing__primaryAction}>
                Continue with Discord
              </SignInButton>

              <Button
                asChild
                size="lg"
                variant="outline"
                className={styles.landing__secondaryAction}
              >
                <Link href="/login">Open the login page</Link>
              </Button>
            </div>

            <div className={styles.landing__stats}>
              <article className={styles.landing__stat}>
                <span className={styles.landing__statValue}>3</span>
                <span className={styles.landing__statLabel}>
                  supported dialects ready for plain-language output.
                </span>
              </article>
              <article className={styles.landing__stat}>
                <span className={styles.landing__statValue}>30 days</span>
                <span className={styles.landing__statLabel}>
                  guest share link expiry for private collaboration.
                </span>
              </article>
              <article className={styles.landing__stat}>
                <span className={styles.landing__statValue}>1 flow</span>
                <span className={styles.landing__statLabel}>
                  from scan to care without switching tools.
                </span>
              </article>
            </div>
          </div>

          <aside className={styles.landing__panel}>
            <div className={styles.landing__panelHeader}>
              <span className={styles.landing__panelTitle}>Patient view</span>
              <span className={styles.landing__panelPill}>demo ready</span>
            </div>

            <article className={styles.landing__result}>
              <span className={styles.landing__resultLabel}>
                Sample result summary
              </span>
              <h2 className={styles.landing__resultTitle}>
                Blood sugar is higher than the target range.
              </h2>
              <p className={styles.landing__resultBody}>
                Klaro explains the value in simple language, points out the
                flagged measure, and suggests the right questions to ask your
                doctor next.
              </p>
              <div className={styles.landing__resultMeta}>
                <span className={styles.landing__resultTag}>Moderate</span>
                <span className={styles.landing__resultTag}>Tagalog</span>
                <span className={styles.landing__resultTag}>Guest safe</span>
              </div>
            </article>

            <div className={styles.landing__workflow}>
              {workflow.map((item) => (
                <div key={item.label} className={styles.landing__workflowStep}>
                  <div>
                    <div className={styles.landing__workflowName}>
                      {item.label}
                    </div>
                    <div className={styles.landing__workflowCopy}>{item.copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.landing__grid}>
          {features.map((feature, index) => (
            <article key={feature.title} className={styles.landing__feature}>
              <span className={styles.landing__featureIndex}>
                0{index + 1}
              </span>
              <h2 className={styles.landing__featureTitle}>{feature.title}</h2>
              <p className={styles.landing__featureBody}>{feature.body}</p>
            </article>
          ))}
        </section>

        <footer className={styles.landing__footer}>
          <span>Built for guest scans, registered history, and private sharing.</span>
          <span>Designed for mobile-first reading, then polished for desktop.</span>
        </footer>
      </div>
    </main>
  );
}
