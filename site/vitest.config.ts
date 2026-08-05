import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    css: false,
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
