import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/validators",
  "packages/db",
  "packages/auth",
  "packages/api",
  "apps/nextjs",
  "apps/expo",
]);
