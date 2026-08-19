import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/validators",
  "packages/db",
  "packages/auth",
  "packages/api",
  "packages/ai-sidecar",
  "apps/nextjs",
  "apps/expo",
]);
