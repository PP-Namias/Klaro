"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@klaro/ui/button";
import styles from "./error.module.css";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <main className={styles.errorBlock}>
      <div className={styles.errorBlock__before}></div>

      <div className={styles.errorBlock__container}>
        <div className={styles.errorBlock__content}>
          <div className={styles.errorBlock__header}>
            <h1 className={styles.errorBlock__title}>Something Went Wrong</h1>
            <p className={styles.errorBlock__eyebrow}>500 Server Error</p>
          </div>

          <div className={styles.errorBlock__message}>
            <p className={styles.errorBlock__copy}>
              We encountered an unexpected error on our servers. This is not your fault – our team is already working to fix it.
            </p>
            <p className={styles.errorBlock__subcopy}>
              Your health information and account data are safe and secure. In the meantime, you can try refreshing the page or return to the dashboard.
            </p>
          </div>

          <div className={styles.errorBlock__errorInfo}>
            <p className={styles.errorBlock__errorLabel}>Error Details:</p>
            <div className={styles.errorBlock__errorBox}>
              <code className={styles.errorBlock__errorCode}>
                {error.message || "An unexpected error occurred. Please try again."}
              </code>
            </div>
          </div>

          <div className={styles.errorBlock__actions}>
            <Button 
              onClick={reset}
              className={styles.errorBlock__button}
            >
              Try Again
            </Button>
            <Link href="/dashboard" className={styles.errorBlock__link}>
              <Button variant="secondary" className={styles.errorBlock__buttonSecondary}>
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className={styles.errorBlock__suggestions}>
            <p className={styles.errorBlock__suggestionLabel}>Troubleshooting:</p>
            <ul className={styles.errorBlock__suggestionList}>
              <li className={styles.errorBlock__suggestionItem}>
                Refresh the page (Ctrl+R or Cmd+R)
              </li>
              <li className={styles.errorBlock__suggestionItem}>
                Clear your browser cache
              </li>
              <li className={styles.errorBlock__suggestionItem}>
                Try again in a few minutes
              </li>
              <li className={styles.errorBlock__suggestionItem}>
                Use a different browser
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.errorBlock__sidebar}>
          <div className={styles.errorBlock__sidebarCard}>
            <h3 className={styles.errorBlock__sidebarTitle}>What Happened?</h3>
            <p className={styles.errorBlock__sidebarText}>
              Our servers experienced a temporary issue while processing your request. This is automatically logged and will be investigated by our engineering team.
            </p>
          </div>

          <div className={styles.errorBlock__sidebarCard}>
            <h3 className={styles.errorBlock__sidebarTitle}>Need Immediate Help?</h3>
            <p className={styles.errorBlock__sidebarText}>
              If this error persists, please contact our support team. We're available to help.
            </p>
            <Link href="/support" className={styles.errorBlock__supportLink}>
              Contact Support
            </Link>
          </div>

          <div className={styles.errorBlock__sidebarCard}>
            <h3 className={styles.errorBlock__sidebarTitle}>Data Safety</h3>
            <p className={styles.errorBlock__sidebarText}>
              Your personal health information is encrypted and stored safely. This error will not affect your data.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
