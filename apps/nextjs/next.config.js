import { fileURLToPath } from "url";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  /**
   * Emit a self-contained server bundle for the Docker image. Left off
   * everywhere else so Vercel keeps using its own build output.
   */
  output: process.env.NEXT_OUTPUT_STANDALONE ? "standalone" : undefined,

  /** File tracing has to start at the monorepo root to follow workspace deps */
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),

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

  /**
   * Must not be bundled into the server build. tesseract.js in particular
   * spawns a worker by resolving a path from its own module location; when
   * bundled, that resolves to the standalone /ROOT placeholder and the OCR
   * request hangs forever instead of failing.
   */
  serverExternalPackages: ["canvas", "pg", "tesseract.js", "pdfjs-dist"],
};

export default config;
