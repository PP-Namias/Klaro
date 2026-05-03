import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@klaro/eslint-config/base";

export default defineConfig(
  {
    ignores: ["script/**"],
  },
  baseConfig,
  restrictEnvAccess,
);
