import Link from "next/link";

import { Button } from "@klaro/ui/button";

import styles from "./page.module.css";

type AuthErrorPageProps = Readonly<{
  searchParams?: Readonly<{
    error?: string | string[];
    error_description?: string | string[];
  }>;
}>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function AuthErrorContent({ searchParams }: AuthErrorPageProps) {
  const errorCode = firstValue(searchParams?.error);
  const errorDescription = firstValue(searchParams?.error_description);

  const getErrorMessage = (code: string | null, description: string | null) => {
    if (description) {
      return description;
    }

    switch (code) {
      case "access_denied":
        return "You declined the sign-in request. To continue, you'll need to authorize Klaro to access your account.";
      case "invalid_request":
        return "The sign-in request was invalid. This might be a temporary issue. Please try again.";
      case "server_error":
        return "The authentication provider encountered an error. Our team has been notified. Please try again in a few moments.";
      case "temporarily_unavailable":
        return "The authentication service is temporarily unavailable. Please try again soon.";
      default:
        return "Authentication did not complete successfully. This is not your fault. Please try signing in again.";
    }
  };

  const getProviderName = (code: string | null) => {
    if (code?.includes("discord")) return "Discord";
    if (code?.includes("google")) return "Google";
    return "authentication provider";
  };

  const errorMessage = getErrorMessage(errorCode, errorDescription);
  const providerName = getProviderName(errorCode);

  return (
    <main className={styles.authErrorBlock}>
      <div className={styles.authErrorBlock__before}></div>

      <div className={styles.authErrorBlock__container}>
        <div className={styles.authErrorBlock__content}>
          <div className={styles.authErrorBlock__header}>
            <h1 className={styles.authErrorBlock__title}>Sign In Incomplete</h1>
            <p className={styles.authErrorBlock__eyebrow}>
              Authentication Error
            </p>
          </div>

          <div className={styles.authErrorBlock__message}>
            <p className={styles.authErrorBlock__copy}>
              We encountered an issue while signing you in with {providerName}.
              This happens sometimes due to network issues or provider
              delays—it's not your fault.
            </p>
            <p className={styles.authErrorBlock__subcopy}>{errorMessage}</p>
          </div>

          {errorCode && (
            <div className={styles.authErrorBlock__errorInfo}>
              <p className={styles.authErrorBlock__errorLabel}>Error Code:</p>
              <code className={styles.authErrorBlock__errorCode}>
                {errorCode}
              </code>
            </div>
          )}

          <div className={styles.authErrorBlock__actions}>
            <Link href="/login" className={styles.authErrorBlock__link}>
              <Button className={styles.authErrorBlock__button}>
                Try Again
              </Button>
            </Link>
            <Link href="/" className={styles.authErrorBlock__link}>
              <Button
                variant="secondary"
                className={styles.authErrorBlock__buttonSecondary}
              >
                Back to Home
              </Button>
            </Link>
          </div>

          <div className={styles.authErrorBlock__suggestions}>
            <p className={styles.authErrorBlock__suggestionLabel}>
              What to try:
            </p>
            <ul className={styles.authErrorBlock__suggestionList}>
              <li className={styles.authErrorBlock__suggestionItem}>
                Return to the login page and try signing in again
              </li>
              <li className={styles.authErrorBlock__suggestionItem}>
                Try a different sign-in method (Discord or Google)
              </li>
              <li className={styles.authErrorBlock__suggestionItem}>
                Check your internet connection
              </li>
              <li className={styles.authErrorBlock__suggestionItem}>
                Clear your browser cookies and try again
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.authErrorBlock__sidebar}>
          <div className={styles.authErrorBlock__sidebarCard}>
            <h3 className={styles.authErrorBlock__sidebarTitle}>
              Your Account Is Safe
            </h3>
            <p className={styles.authErrorBlock__sidebarText}>
              This authentication error does not affect your account or any
              stored health information. Everything is secure.
            </p>
          </div>

          <div className={styles.authErrorBlock__sidebarCard}>
            <h3 className={styles.authErrorBlock__sidebarTitle}>
              Still Having Issues?
            </h3>
            <p className={styles.authErrorBlock__sidebarText}>
              If this error persists after several attempts, please contact our
              support team. We're here to help you get back in.
            </p>
            <Link
              href="/support"
              className={styles.authErrorBlock__supportLink}
            >
              Contact Support
            </Link>
          </div>

          <div className={styles.authErrorBlock__sidebarCard}>
            <h3 className={styles.authErrorBlock__sidebarTitle}>
              How We Protect You
            </h3>
            <p className={styles.authErrorBlock__sidebarText}>
              Klaro uses industry-standard encryption for all authentication
              flows. Your credentials are never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  return <AuthErrorContent searchParams={searchParams} />;
}
