import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineProject({
  test: {
    globals: true,
    setupFiles: [resolve(dirname, "../../vitest.setup.ts")],
    include: [
      "src/services/**/*.test.ts",
      "src/services/**/*.test.tsx",
      "src/services/**/*.spec.ts",
      "src/middleware/**/*.test.ts",
      "src/middleware/**/*.test.tsx",
      "src/utils/**/*.test.ts",
      "src/utils/**/*.test.tsx",
      "src/__tests__/integration.test.ts",
      "src/router/__tests__/documents-generate-analysis.test.ts",
      "src/router/__tests__/extraction-edge-cases.test.ts",
      "src/router/__tests__/chat-sidecar.test.ts",
    ],
    exclude: [
      "src/services/__tests__/facilityImport.test.ts",
      "node_modules/**",
      "dist/**",
    ],
  },
});
