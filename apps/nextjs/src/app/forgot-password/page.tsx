import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@klaro/ui/button";

import { getSession } from "~/auth/server";

import styles from "./page.module.css";

export const metadata = {
  title: "Forgot password",
  description: "Reset your Klaro account password.",
};

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.forgot}>
      <div className={styles.forgot__shell}>
        <header className={styles.forgot__header}>
          <div className={styles.forgot__brand}>
            <span className={styles.forgot__brandMark}>K</span>
            <div className={styles.forgot__brandText}>
              <span className={styles.forgot__brandName}>Klaro</span>
              <span className={styles.forgot__brandTag}>Healthcare for Filipinos</span>
            </div>
          </div>

          <Button asChild size="lg" variant="outline" className={styles.forgot__ghostAction}>
            <Link href="/">Back to landing</Link>
          </Button>
        </header>

        <section className={styles.forgot__hero}>
          <div className={styles.forgot__column}>
            <div className="space-y-6">
              <p className={styles.forgot__eyebrow}>Password reset</p>
              <h1 className={styles.forgot__title}>Recover your Klaro account.</h1>
              <p className={styles.forgot__lede}>
                Enter the email address associated with your account and we'll send you a secure link
                to reset your password. You should receive the link within a few minutes.
              </p>
            </div>

            <div className={styles.forgot__form}>
              <div className={styles.forgot__field}>
                <label className={styles.forgot__label}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={styles.forgot__input}
                  required
                />
              </div>

              <Button size="lg" className={styles.forgot__submit}>
                Send reset link
              </Button>

              <div className={styles.forgot__footer}>
                <span className={styles.forgot__footerText}>Remember your password?</span>
                <Button asChild variant="link" className={styles.forgot__footerLink}>
                  <Link href="/login">Sign in instead</Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className={styles.forgot__info}>
            <div className={styles.forgot__infoHeader}>
              <span className={styles.forgot__infoTitle}>What happens next</span>
            </div>

            <article className={styles.forgot__step}>
              <span className={styles.forgot__stepLabel}>Step 1</span>
              <h3 className={styles.forgot__stepTitle}>Verify your email</h3>
              <p className={styles.forgot__stepCopy}>
                We'll send a secure link to your inbox. This link works for one hour,
                then expires for security.
              </p>
            </article>

            <article className={styles.forgot__step}>
              <span className={styles.forgot__stepLabel}>Step 2</span>
              <h3 className={styles.forgot__stepTitle}>Click the link</h3>
              <p className={styles.forgot__stepCopy}>
                Open the email and click the reset password link. If you don't see it,
                check your spam folder.
              </p>
            </article>

            <article className={styles.forgot__step}>
              <span className={styles.forgot__stepLabel}>Step 3</span>
              <h3 className={styles.forgot__stepTitle}>Create a new password</h3>
              <p className={styles.forgot__stepCopy}>
                Choose a strong password at least 8 characters long. Make it unique
                to keep your medical data secure.
              </p>
            </article>

            <div className={styles.forgot__security}>
              <span className={styles.forgot__securityLabel}>Security note</span>
              <p className={styles.forgot__securityCopy}>
                Klaro never asks for your password via email. If you receive a suspicious email,
                please report it immediately.
              </p>
            </div>
          </aside>
        </section>

        <footer className={styles.forgot__footer}>
          <span>Your account recovery is secure and private.</span>
          <span>Links expire after one hour for your protection.</span>
        </footer>
      </div>
    </main>
  );
}
