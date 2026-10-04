import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@judgehub/schemas": path.resolve(__dirname, "packages/schemas/src/index.ts"),
      "@judgehub/policy": path.resolve(__dirname, "packages/policy/src/index.ts"),
      "@judgehub/db": path.resolve(__dirname, "packages/db/src/index.ts"),
      "@judgehub/scoring": path.resolve(__dirname, "packages/scoring/src/index.ts"),
      "@judgehub/registry": path.resolve(__dirname, "packages/registry/src/index.ts"),
      "@judgehub/ui": path.resolve(__dirname, "packages/ui/src/index.ts"),
    },
  },
});
