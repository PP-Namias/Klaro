import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@klaro/ui/button";

import { SignInButton } from "../../components/sign-in-button";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign up | Klaro",
  description:
    "Create an account to save your medical document history and analysis.",
};

const benefits = [
  {
    title: "Private history",
    body: "Your medical documents, scans, and analyses stay only with you. Export any time, no lock-in.",
  },
  {
    title: "Saved context",
    body: "Chat history, plain-language summaries, and care recommendations stay attached to each document.",
  },
  {
    title: "Quick access",
    body: "Find your past scans without re-uploading. Compare values over time.",
  },
] as const;

export default async function SignUpPage() {
  return (
    <main className={styles.signup}>
      <div className={styles.signup__shell}>
        <section className={styles.signup__panel}>
          <div className="space-y-6">
            <p className={styles.signup__eyebrow}>Create account</p>
            <h1 className={styles.signup__title}>
              Join Klaro and save your history.
            </h1>
            <p className={styles.signup__lede}>
              A registered account keeps your medical documents,
              plain-language summaries, and care context together securely.
            </p>
          </div>

          <div className={styles.signup__benefits}>
            {benefits.map((benefit, index) => (
              <article key={benefit.title} className={styles.signup__benefit}>
                <span className={styles.signup__benefitIndex}>{index + 1}</span>
                <div>
                  <h2 className={styles.signup__benefitTitle}>
                    {benefit.title}
                  </h2>
                  <p className={styles.signup__benefitBody}>{benefit.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.signup__card}>
          <div className={styles.signup__cardKicker}>Get started</div>
          <h2 className={styles.signup__cardTitle}>Continue with Discord.</h2>
          <p className={styles.signup__cardCopy}>
            Sign up with your Discord account to keep the flow fast. Guest mode
            stays available if you only want to scan and share a single result.
          </p>

          <div className={styles.signup__cardActions}>
            <SignInButton className={styles.signup__primaryAction}>
              Continue with Discord
            </SignInButton>

            <Button
              asChild
              size="lg"
              variant="outline"
              className={styles.signup__secondaryAction}
            >
              <Link href="/">Continue as guest</Link>
            </Button>
          </div>

          <p className={styles.signup__note}>
            By creating an account, you agree to Klaro&apos;s Terms of Service
            and Privacy Policy. Your data stays private by default.
          </p>

          <p className={styles.signup__footerLink}>
            Already have an account?{" "}
            <Link href="/login" className={styles.signup__link}>
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
