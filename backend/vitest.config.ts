import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15000,
    env: {
      DATABASE_URL: "postgresql://postgres:postgre123@localhost:5432/crimson_code_test_fallback",
    },
  },
});
