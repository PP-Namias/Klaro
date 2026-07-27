import { defineConfig } from "eslint/config";

import { baseConfig } from "@klaro/eslint-config/base";

export default defineConfig(
  {
    ignores: ["api/**"],
  },
  baseConfig,
  { ignores: ["**/__tests__/**", "**/*.test.*", "**/__test-utils__/**"] },
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-implied-eval": "warn",
      "@typescript-eslint/require-await": "warn",
    },
  },
);
