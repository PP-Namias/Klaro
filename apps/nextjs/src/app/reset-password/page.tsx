import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@klaro/ui/button";

import { getSession } from "~/auth/server";
import styles from "./page.module.css";

export const metadata = {
  title: "Reset password",
  description: "Create a new password for your Klaro account.",
};

export default async function ResetPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.reset}>
      <div className={styles.reset__shell}>
        <header className={styles.reset__header}>
          <div className={styles.reset__brand}>
            <span className={styles.reset__brandMark}>K</span>
            <div className={styles.reset__brandText}>
              <span className={styles.reset__brandName}>Klaro</span>
              <span className={styles.reset__brandTag}>
                Healthcare for Filipinos
              </span>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            variant="outline"
            className={styles.reset__ghostAction}
          >
            <Link href="/">Back to landing</Link>
          </Button>
        </header>

        <section className={styles.reset__hero}>
          <div className={styles.reset__column}>
            <div className="space-y-6">
              <p className={styles.reset__eyebrow}>Create new password</p>
              <h1 className={styles.reset__title}>Set a secure password.</h1>
              <p className={styles.reset__lede}>
                Choose a strong password that you haven't used before. Your
                password should be at least 8 characters and include numbers and
                uppercase letters.
              </p>
            </div>

            <div className={styles.reset__form}>
              <div className={styles.reset__field}>
                <label className={styles.reset__label}>New password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  className={styles.reset__input}
                  required
                />
                <div className={styles.reset__strength}>
                  <div className={styles.reset__strengthBar}></div>
                  <span className={styles.reset__strengthLabel}>
                    Strong password required
                  </span>
                </div>
              </div>

              <div className={styles.reset__field}>
                <label className={styles.reset__label}>Confirm password</label>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  className={styles.reset__input}
                  required
                />
              </div>

              <div className={styles.reset__checklist}>
                <div className={styles.reset__checkItem}>
                  <span className={styles.reset__checkIcon}>L</span>
                  <span className={styles.reset__checkText}>
                    At least 8 characters
                  </span>
                </div>
                <div className={styles.reset__checkItem}>
                  <span className={styles.reset__checkIcon}>N</span>
                  <span className={styles.reset__checkText}>
                    One number (0-9)
                  </span>
                </div>
                <div className={styles.reset__checkItem}>
                  <span className={styles.reset__checkIcon}>U</span>
                  <span className={styles.reset__checkText}>
                    One uppercase letter (A-Z)
                  </span>
                </div>
              </div>

              <Button size="lg" className={styles.reset__submit}>
                Reset password
              </Button>

              <div className={styles.reset__footer}>
                <span className={styles.reset__footerText}>
                  Already set a new password?
                </span>
                <Button
                  asChild
                  variant="link"
                  className={styles.reset__footerLink}
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className={styles.reset__tips}>
            <div className={styles.reset__tipsHeader}>
              <span className={styles.reset__tipsTitle}>Password tips</span>
            </div>

            <article className={styles.reset__tip}>
              <span className={styles.reset__tipLabel}>Make it unique</span>
              <p className={styles.reset__tipCopy}>
                Avoid passwords used on other websites. Use a password manager
                if you need help remembering.
              </p>
            </article>

            <article className={styles.reset__tip}>
              <span className={styles.reset__tipLabel}>Don't share it</span>
              <p className={styles.reset__tipCopy}>
                Klaro support staff will never ask for your password. Keep it
                private and secure.
              </p>
            </article>

            <article className={styles.reset__tip}>
              <span className={styles.reset__tipLabel}>Update regularly</span>
              <p className={styles.reset__tipCopy}>
                Change your password every few months to keep your medical data
                protected.
              </p>
            </article>

            <div className={styles.reset__security}>
              <span className={styles.reset__securityLabel}>
                Your security matters
              </span>
              <p className={styles.reset__securityCopy}>
                Klaro uses industry-standard encryption to protect your medical
                documents and personal information.
              </p>
            </div>
          </aside>
        </section>

        <footer className={styles.reset__pageFooter}>
          <span>Your password reset is secure and encrypted.</span>
          <span>You'll be able to sign in immediately after.</span>
        </footer>
      </div>
    </main>
  );
}
