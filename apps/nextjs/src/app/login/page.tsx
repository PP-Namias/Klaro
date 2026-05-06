import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignInButton } from "../../components/sign-in-button";
import { auth } from "~/auth/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in | Klaro",
  description:
    "Sign in to Klaro to save history, revisit past analyses, and keep your care flow private.",
};

type LoginPageProps = {
  searchParams?: {
    auto?: string | string[];
    callbackURL?: string | string[];
    provider?: string | string[];
  };
};

const resolveParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const resolveProvider = (value?: string | string[]) =>
  resolveParam(value) === "google" ? "google" : "discord";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auto = resolveParam(searchParams?.auto);
  if (auto === "1" || auto === "true") {
    const callbackURL = resolveParam(searchParams?.callbackURL) ?? "/";
    const provider = resolveProvider(searchParams?.provider);
    const result = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL,
      },
    });

    if (!result.url) {
      throw new Error("No URL returned from signInSocial");
    }

    redirect(result.url);
  }

  return (
    <main className={styles.login}>
      <div className={styles.login__shell}>
        <h1 className={styles.login__title}>Welcome to Klaro</h1>

        <div className={styles.login__actions}>
          <SignInButton
            provider="discord"
            className={`${styles.login__providerButton} ${styles["login__providerButton--discord"]}`}
          >
            <Image
              src="/discord.svg"
              alt=""
              width={22}
              height={22}
              className={`${styles.login__icon} ${styles.login__iconDiscord}`}
            />
            Sign in with Discord
          </SignInButton>

          <SignInButton
            provider="google"
            variant="outline"
            className={`${styles.login__providerButton} ${styles["login__providerButton--google"]}`}
          >
            <Image
              src="/google.svg"
              alt=""
              width={22}
              height={22}
              className={styles.login__icon}
            />
            Sign in with Google
          </SignInButton>
        </div>
      </div>
    </main>
  );
}
