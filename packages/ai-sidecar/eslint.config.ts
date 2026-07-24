import { defineConfig } from "eslint/config";

import { baseConfig } from "@klaro/eslint-config/base";

export default defineConfig(
  {
    ignores: ["api/**"],
  },
  baseConfig,
);
