import type { Metadata } from "next";

import Link from "next/link";

import { Button } from "@klaro/ui/button";

import { SignInButton } from "../_components/sign-in-button";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in | Klaro",
  description:
    "Sign in to Klaro to save history, revisit past analyses, and keep your care flow private.",
};

const benefits = [
  {
    title: "Keep history private",
    body: "Registered users can opt in to save documents and revisit past analyses later.",
  },
  {
    title: "Return to the same context",
    body: "Scan once, then continue the conversation without re-explaining the document.",
  },
  {
    title: "Move from answer to action",
    body: "Clinic discovery, doctor booking, and payments stay connected to the same record.",
  },
] as const;

export default function LoginPage() {
  return (
    <main className={styles.login}>
      <div className={styles.login__shell}>
        <section className={styles.login__panel}>
          <div className="space-y-6">
            <p className={styles.login__eyebrow}>Sign in to Klaro</p>
            <h1 className={styles.login__title}>
              Get a calmer path from scan to care.
            </h1>
            <p className={styles.login__lede}>
              Log in to keep your document context, compare past analyses, and
              return to the same conversation whenever you need it.
            </p>
          </div>

          <div className={styles.login__benefits}>
            {benefits.map((benefit, index) => (
              <article key={benefit.title} className={styles.login__benefit}>
                <span className={styles.login__benefitIndex}>{index + 1}</span>
                <div>
                  <h2 className={styles.login__benefitTitle}>{benefit.title}</h2>
                  <p className={styles.login__benefitBody}>{benefit.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.login__card}>
          <div className={styles.login__cardKicker}>Access options</div>
          <h2 className={styles.login__cardTitle}>Continue with Discord.</h2>
          <p className={styles.login__cardCopy}>
            Sign in with your Discord account to keep the flow fast. Guest mode
            stays available if you only want to scan and share a single result.
          </p>

          <div className={styles.login__cardActions}>
            <SignInButton className={styles.login__primaryAction}>
              Continue with Discord
            </SignInButton>

            <Button
              asChild
              size="lg"
              variant="outline"
              className={styles.login__secondaryAction}
            >
              <Link href="/">Continue as guest</Link>
            </Button>
          </div>

          <p className={styles.login__note}>
            By continuing, you keep the session tied to Klaro&apos;s private
            document context and can return to the same analysis later.
          </p>
        </section>
      </div>
    </main>
  );
}