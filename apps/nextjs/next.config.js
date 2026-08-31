import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@klaro/api",
    "@klaro/auth",
    "@klaro/db",
    "@klaro/ui",
    "@klaro/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },

  /** Canvas native module needs to be externalized for server builds */
  serverExternalPackages: ["sharp"],
};

export default config;
