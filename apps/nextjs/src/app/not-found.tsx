import Link from "next/link";
import { Button } from "@klaro/ui/button";
import styles from "./not-found.module.css";

export const metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Return to dashboard.",
};

export default function NotFound() {
  return (
    <main className={styles.notFoundBlock}>
      <div className={styles.notFoundBlock__before}></div>

      <div className={styles.notFoundBlock__container}>
        <div className={styles.notFoundBlock__content}>
          <div className={styles.notFoundBlock__header}>
            <h1 className={styles.notFoundBlock__title}>Page Not Found</h1>
            <p className={styles.notFoundBlock__eyebrow}>404 Error</p>
          </div>

          <div className={styles.notFoundBlock__message}>
            <p className={styles.notFoundBlock__copy}>
              The page you're looking for doesn't exist or has been moved. This sometimes happens when links are outdated or if there's a typo in the address.
            </p>
            <p className={styles.notFoundBlock__subcopy}>
              Don't worry – your account and health information are safe. Let's get you back on track.
            </p>
          </div>

          <div className={styles.notFoundBlock__actions}>
            <Link href="/dashboard" className={styles.notFoundBlock__link}>
              <Button className={styles.notFoundBlock__button}>
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/" className={styles.notFoundBlock__link}>
              <Button variant="secondary" className={styles.notFoundBlock__buttonSecondary}>
                Go to Home
              </Button>
            </Link>
          </div>

          <div className={styles.notFoundBlock__suggestions}>
            <p className={styles.notFoundBlock__suggestionLabel}>Common pages:</p>
            <ul className={styles.notFoundBlock__suggestionList}>
              <li className={styles.notFoundBlock__suggestionItem}>
                <Link href="/scan" className={styles.notFoundBlock__suggestionLink}>
                  Start a New Scan
                </Link>
              </li>
              <li className={styles.notFoundBlock__suggestionItem}>
                <Link href="/login" className={styles.notFoundBlock__suggestionLink}>
                  Sign In
                </Link>
              </li>
              <li className={styles.notFoundBlock__suggestionItem}>
                <Link href="/signup" className={styles.notFoundBlock__suggestionLink}>
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.notFoundBlock__sidebar}>
          <div className={styles.notFoundBlock__sidebarCard}>
            <h3 className={styles.notFoundBlock__sidebarTitle}>Need Help?</h3>
            <p className={styles.notFoundBlock__sidebarText}>
              If you believe this page should exist, please contact our support team. We're here to help.
            </p>
            <Link href="/support" className={styles.notFoundBlock__supportLink}>
              Contact Support
            </Link>
          </div>

          <div className={styles.notFoundBlock__sidebarCard}>
            <h3 className={styles.notFoundBlock__sidebarTitle}>Quick Tips</h3>
            <ul className={styles.notFoundBlock__tipsList}>
              <li className={styles.notFoundBlock__tipsItem}>Check the URL for typos</li>
              <li className={styles.notFoundBlock__tipsItem}>Try using the navigation menu</li>
              <li className={styles.notFoundBlock__tipsItem}>Return to the previous page</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
