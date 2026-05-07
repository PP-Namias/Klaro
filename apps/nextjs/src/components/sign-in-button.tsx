import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Button } from "@klaro/ui/button";

import { auth } from "~/auth/server";

interface SignInButtonProps {
  children: ReactNode;
  className?: string;
  callbackURL?: string;
  provider?: "discord" | "google";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SignInButton({
  children,
  className,
  callbackURL = "/",
  provider = "discord",
  variant,
  size = "lg",
}: SignInButtonProps) {
  return (
    <form>
      <Button
        size={size}
        variant={variant}
        className={className}
        formAction={async () => {
          "use server";

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
        }}
      >
        {children}
      </Button>
    </form>
  );
}
