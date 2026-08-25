import { defineConfig } from "vitest/config";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://localhost:5432/unreachable_placeholder";
}

export default defineConfig({
  test: {
    testTimeout: 15000,
  },
});
