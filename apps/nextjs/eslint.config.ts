import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@klaro/eslint-config/base";
import { nextjsConfig } from "@klaro/eslint-config/nextjs";
import { reactConfig } from "@klaro/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
