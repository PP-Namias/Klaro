import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@klaro/eslint-config/base";
import { reactConfig } from "@klaro/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
