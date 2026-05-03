import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { Button } from "@klaro/ui/button";

import { auth } from "~/auth/server";

type SignInButtonProps = {
  children: ReactNode;
  className?: string;
  callbackURL?: string;
};

export function SignInButton({
  children,
  className,
  callbackURL = "/",
}: SignInButtonProps) {
  return (
    <form>
      <Button
        size="lg"
        className={className}
        formAction={async () => {
          "use server";

          const result = await auth.api.signInSocial({
            body: {
              provider: "discord",
              callbackURL,
            },
          });

          if (!result.url) {
            throw new Error("No URL returned from signInSocial");
          }

          redirect(result.url);
        }}
      >
        {children}
      </Button>
    </form>
  );
}