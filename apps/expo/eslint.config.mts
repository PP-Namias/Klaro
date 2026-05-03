import { defineConfig } from "eslint/config";

import { baseConfig } from "@klaro/eslint-config/base";
import { reactConfig } from "@klaro/eslint-config/react";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
