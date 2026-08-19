import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      JWT_SECRET: "test-jwt-secret",
      RATE_LIMIT_MAX_REQUESTS: "1000",
      RATE_LIMIT_WINDOW_MS: "60000",
    },
  },
});
