import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { buildApp } from "../src/app";
import { pool } from "../src/db/pool";

describe("Read Decrement Concurrency API", () => {
  let app = buildApp();
  let isDbConnected = false;
  const createdIds: string[] = [];

  beforeAll(async () => {
    try {
      const client = await pool.connect();
      client.release();
      isDbConnected = true;
    } catch (err) {
      // Skip handled in individual tests
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      try {
        if (createdIds.length > 0) {
          await pool.query("DELETE FROM capsules WHERE id = ANY($1)", [createdIds]);
        }
      } catch (err) {
        console.error("Cleanup error:", err);
      } finally {
        await pool.end();
      }
    }
  });

  it("ensures atomic single-use decrement (exactly one succeeds and one fails under concurrent requests)", async (ctx) => {
    if (!isDbConnected) {
      ctx.skip();
      return;
    }

    // 1. Create a capsule with maxReads = 1
    const createRes = await app.inject({
      method: "POST",
      url: "/api/capsules",
      payload: {
        ciphertext: "single_use_secrets",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        maxReads: 1,
      },
    });

    expect(createRes.statusCode).toBe(201);
    const capsule = createRes.json();
    createdIds.push(capsule.id);

    // 2. Launch two requests genuinely in parallel
    const request1 = app.inject({
      method: "GET",
      url: `/api/capsules/${capsule.id}`,
    });

    const request2 = app.inject({
      method: "GET",
      url: `/api/capsules/${capsule.id}`,
    });

    const [res1, res2] = await Promise.all([request1, request2]);

    const statusCodes = [res1.statusCode, res2.statusCode];
    const successfulResponses = statusCodes.filter(code => code === 200).length;
    const rateLimitedOrExhaustedResponses = statusCodes.filter(code => code === 410).length;

    // Report what the concurrency test asserts
    console.log(`Concurrency Test Result for capsule ${capsule.id}: Request 1 status = ${res1.statusCode}, Request 2 status = ${res2.statusCode}`);

    // Verify atomicity:
    // Exactly one GET request should succeed with 200 (since maxReads = 1).
    // Exactly one GET request should fail with 410 (Max read limit reached).
    expect(successfulResponses).toBe(1);
    expect(rateLimitedOrExhaustedResponses).toBe(1);

    const successRes = res1.statusCode === 200 ? res1 : res2;
    const failureRes = res1.statusCode === 410 ? res1 : res2;

    expect(successRes.json().ciphertext).toBe("single_use_secrets");
    expect(failureRes.json()).toEqual({ error: "Max read limit reached" });
  });
});
