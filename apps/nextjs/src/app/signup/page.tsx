import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@klaro/ui/button";

import { getSession } from "~/auth/server";
import styles from "./page.module.css";

export const metadata = {
  title: "Sign up for Klaro",
  description:
    "Create an account to save your medical document history and analysis.",
};

export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.signup}>
      <div className={styles.signup__shell}>
        <header className={styles.signup__header}>
          <div className={styles.signup__brand}>
            <span className={styles.signup__brandMark}>K</span>
            <div className={styles.signup__brandText}>
              <span className={styles.signup__brandName}>Klaro</span>
              <span className={styles.signup__brandTag}>
                Healthcare for Filipinos
              </span>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            variant="outline"
            className={styles.signup__ghostAction}
          >
            <Link href="/">Back to landing</Link>
          </Button>
        </header>

        <section className={styles.signup__hero}>
          <div className={styles.signup__column}>
            <div className="space-y-6">
              <p className={styles.signup__eyebrow}>Create account</p>
              <h1 className={styles.signup__title}>
                Join Klaro and save your history.
              </h1>
              <p className={styles.signup__lede}>
                A registered account keeps your medical documents,
                plain-language summaries, and care context together securely.
                Your first scan can start right now.
              </p>
            </div>

            <div className={styles.signup__form}>
              <div className={styles.signup__field}>
                <label className={styles.signup__label}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={styles.signup__input}
                  required
                />
              </div>

              <div className={styles.signup__field}>
                <label className={styles.signup__label}>Full name</label>
                <input
                  type="text"
                  placeholder="First and last name"
                  className={styles.signup__input}
                  required
                />
              </div>

              <div className={styles.signup__field}>
                <label className={styles.signup__label}>Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters, 1 uppercase, 1 number"
                  className={styles.signup__input}
                  required
                />
                <span className={styles.signup__help}>
                  Secure passwords help protect your medical data.
                </span>
              </div>

              <div className={styles.signup__terms}>
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className={styles.signup__checkbox}
                />
                <label htmlFor="terms" className={styles.signup__termsLabel}>
                  I agree to Klaro's Terms of Service and Privacy Policy
                </label>
              </div>

              <Button size="lg" className={styles.signup__submit}>
                Create my account
              </Button>

              <div className={styles.signup__divider}>Or continue with</div>

              <div className={styles.signup__ssoRow}>
                <Button
                  size="lg"
                  variant="outline"
                  className={styles.signup__ssoButton}
                >
                  Discord
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={styles.signup__ssoButton}
                >
                  Google
                </Button>
              </div>

              <div className={styles.signup__footer}>
                <span className={styles.signup__footerText}>
                  Already have an account?
                </span>
                <Button
                  asChild
                  variant="link"
                  className={styles.signup__footerLink}
                >
                  <Link href="/login">Sign in instead</Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className={styles.signup__benefits}>
            <div className={styles.signup__benefitsHeader}>
              <span className={styles.signup__benefitsTitle}>
                Your account benefits
              </span>
            </div>

            <article className={styles.signup__benefit}>
              <span className={styles.signup__benefitLabel}>
                Private history
              </span>
              <h3 className={styles.signup__benefitTitle}>
                Your medical documents stay only with you.
              </h3>
              <p className={styles.signup__benefitCopy}>
                Once saved, Klaro keeps your scans, analyses, and clinic
                bookings in one secure place. Export any time, no lock-in.
              </p>
            </article>

            <article className={styles.signup__benefit}>
              <span className={styles.signup__benefitLabel}>Saved context</span>
              <h3 className={styles.signup__benefitTitle}>
                Pick up where you left off, or start fresh anytime.
              </h3>
              <p className={styles.signup__benefitCopy}>
                Chat history, plain-language summaries, and care recommendations
                stay attached to each document you upload.
              </p>
            </article>

            <article className={styles.signup__benefit}>
              <span className={styles.signup__benefitLabel}>Quick access</span>
              <h3 className={styles.signup__benefitTitle}>
                Find your past scans without re-uploading.
              </h3>
              <p className={styles.signup__benefitCopy}>
                Klaro organizes your documents by date and type, so you can jump
                to a specific result or compare values over time.
              </p>
            </article>

            <div className={styles.signup__stats}>
              <article className={styles.signup__stat}>
                <span className={styles.signup__statValue}>2m</span>
                <span className={styles.signup__statLabel}>
                  average time to scan and understand a document
                </span>
              </article>
              <article className={styles.signup__stat}>
                <span className={styles.signup__statValue}>private</span>
                <span className={styles.signup__statLabel}>
                  guest mode stays available for quick one-time scans
                </span>
              </article>
            </div>
          </aside>
        </section>

        <footer className={styles.signup__footer}>
          <span>
            Your account is secure, encrypted, and stays private by default.
          </span>
          <span>Opt-in to history. Delete anytime.</span>
        </footer>
      </div>
    </main>
  );
}
