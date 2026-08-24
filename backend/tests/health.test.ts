import { describe, it, expect, afterAll } from "vitest";

import { buildApp } from "../src/app";
import { pool } from "../src/db/pool";

describe("Health Check API", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("GET /api/health returns 200 with status ok", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
