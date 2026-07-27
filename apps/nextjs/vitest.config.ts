import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineProject({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    globals: true,
    setupFiles: [
      fileURLToPath(new URL("../../vitest.setup.ts", import.meta.url)),
    ],
    environment: "jsdom",
    exclude: [
      "**/e2e/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/maps/nearby/__tests__/route.test.ts",
    ],
  },
});
