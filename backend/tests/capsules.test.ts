import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { buildApp } from "../src/app";
import { pool } from "../src/db/pool";

describe("Capsule Creation & Retrieval API", () => {
  let app = buildApp();
  let isDbConnected = false;
  let dbError: any = null;
  const createdIds: string[] = [];

  beforeAll(async () => {
    try {
      const client = await pool.connect();
      client.release();
      isDbConnected = true;
    } catch (err: any) {
      dbError = err;
      if (process.env.GITHUB_ACTIONS || process.env.CI) {
        throw new Error(`[CI FAILURE] PostgreSQL database connection failed: ${err.message}`);
      }
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      try {
        if (createdIds.length > 0) {
          await pool.query("DELETE FROM capsules WHERE id = ANY($1)", [createdIds]);
        }
        await pool.query("DELETE FROM capsules WHERE id IN ($1, $2, $3)", ["expired-test-id", "exhausted-test-id", "unlimited-test-id"]);
      } catch (err) {
        console.error("Cleanup error:", err);
      } finally {
        await pool.end();
      }
    }
  });

  describe("POST /api/capsules - Input Validation", () => {
    it("rejects request if ciphertext is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toHaveProperty("error", "Validation Error");
      expect(body.details.fieldErrors).toHaveProperty("ciphertext");
    });

    it("rejects request if ciphertext is empty", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().details.fieldErrors.ciphertext[0]).toContain("cannot be empty");
    });

    it("rejects request if expiresAt is in the past", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "secret",
          expiresAt: new Date(Date.now() - 60000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().details.fieldErrors.expiresAt[0]).toContain("must be in the future");
    });

    it("rejects request if expiresAt is invalid ISO 8601 string", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "secret",
          expiresAt: "invalid-date",
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().details.fieldErrors.expiresAt[0]).toContain("must be a valid ISO 8601 timestamp");
    });

    it("rejects request if maxReads is negative, zero, or > 100", async () => {
      const payloads = [
        { ciphertext: "secret", expiresAt: new Date(Date.now() + 60000).toISOString(), maxReads: 0 },
        { ciphertext: "secret", expiresAt: new Date(Date.now() + 60000).toISOString(), maxReads: -5 },
        { ciphertext: "secret", expiresAt: new Date(Date.now() + 60000).toISOString(), maxReads: 101 },
        { ciphertext: "secret", expiresAt: new Date(Date.now() + 60000).toISOString(), maxReads: 5.5 },
      ];

      for (const p of payloads) {
        const res = await app.inject({
          method: "POST",
          url: "/api/capsules",
          payload: p,
        });
        expect(res.statusCode).toBe(400);
        expect(res.json().details.fieldErrors.maxReads).toBeDefined();
      }
    });

    it("rejects malformed JSON with 400 rather than crashing or throwing 500", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        headers: { "Content-Type": "application/json" },
        body: "{ malformed: json",
      });
      // Fastify parses body, returning 400 Bad Request
      expect(res.statusCode).toBe(400);
      expect(res.json()).toHaveProperty("error");
    });

    it("silently drops unexpected top-level fields", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "secret",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          isAdmin: true, // extra field
        },
      });
      expect(res.statusCode).toBe(201);
      const data = res.json();
      createdIds.push(data.id);
      expect(data).not.toHaveProperty("isAdmin");
    });

    it("accepts arbitrarily large/deeply-nested metadata (documented hardening gap)", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const deepMetadata: Record<string, any> = {};
      let temp = deepMetadata;
      for (let i = 0; i < 20; i++) {
        temp.nested = {};
        temp = temp.nested;
      }
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "secret",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          metadata: deepMetadata,
        },
      });
      expect(res.statusCode).toBe(201);
      createdIds.push(res.json().id);
    });
  });

  describe("Capsule Lifecycle & DB-dependent Tests", () => {
    it("successfully creates a valid capsule", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "encrypted_payload",
          metadata: { client: "web" },
          expiresAt: futureDate,
          maxReads: 5,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toHaveProperty("id");
      expect(typeof body.id).toBe("string");
      expect(body.id).toHaveLength(24); // 12-byte hex ID
      expect(body.expiresAt).toBe(futureDate);
      createdIds.push(body.id);
    });

    it("successfully retrieves an existing unexpired, unexhausted capsule", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const createRes = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "valid_ciphertext",
          metadata: { test: true },
          expiresAt: futureDate,
          maxReads: 2,
        },
      });
      const capsule = createRes.json();
      createdIds.push(capsule.id);

      const getRes = await app.inject({
        method: "GET",
        url: `/api/capsules/${capsule.id}`,
      });
      expect(getRes.statusCode).toBe(200);
      const data = getRes.json();
      expect(data).toEqual({
        id: capsule.id,
        ciphertext: "valid_ciphertext",
        metadata: { test: true },
        expiresAt: futureDate,
        remainingReads: 1, // Decremented once
      });
    });

    it("returns 404 for a nonexistent ID", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const getRes = await app.inject({
        method: "GET",
        url: "/api/capsules/000000000000000000000000",
      });
      expect(getRes.statusCode).toBe(404);
      expect(getRes.json()).toEqual({ error: "Capsule not found" });
    });

    it("returns 404 for a near-miss ID to verify resistance against enumeration", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const createRes = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "valid_ciphertext",
          expiresAt: futureDate,
        },
      });
      const capsule = createRes.json();
      createdIds.push(capsule.id);

      // Modify the last character of the ID
      const nearMissId = capsule.id.slice(0, -1) + (capsule.id.endsWith("a") ? "b" : "a");
      const getRes = await app.inject({
        method: "GET",
        url: `/api/capsules/${nearMissId}`,
      });
      expect(getRes.statusCode).toBe(404);
      expect(getRes.json()).toEqual({ error: "Capsule not found" });
    });

    it("returns 410 for an expired capsule", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const expiredId = "expired-test-id";
      await pool.query(
        `INSERT INTO capsules (id, ciphertext, metadata, expires_at, max_reads, remaining_reads)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [expiredId, "expired_ciphertext", JSON.stringify({}), new Date(Date.now() - 5000), 5, 5]
      );

      const getRes = await app.inject({
        method: "GET",
        url: `/api/capsules/${expiredId}`,
      });
      expect(getRes.statusCode).toBe(410);
      expect(getRes.json()).toEqual({ error: "Capsule expired" });
    });

    it("returns 410 for an exhausted capsule", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const exhaustedId = "exhausted-test-id";
      await pool.query(
        `INSERT INTO capsules (id, ciphertext, metadata, expires_at, max_reads, remaining_reads)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [exhaustedId, "exhausted_ciphertext", JSON.stringify({}), new Date(Date.now() + 60000), 5, 0]
      );

      const getRes = await app.inject({
        method: "GET",
        url: `/api/capsules/${exhaustedId}`,
      });
      expect(getRes.statusCode).toBe(410);
      expect(getRes.json()).toEqual({ error: "Max read limit reached" });
    });

    it("supports unlimited reads when maxReads is null", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const unlimitedId = "unlimited-test-id";
      await pool.query(
        `INSERT INTO capsules (id, ciphertext, metadata, expires_at, max_reads, remaining_reads)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [unlimitedId, "unlimited_ciphertext", JSON.stringify({}), new Date(Date.now() + 60000), null, null]
      );

      for (let i = 0; i < 5; i++) {
        const getRes = await app.inject({
          method: "GET",
          url: `/api/capsules/${unlimitedId}`,
        });
        expect(getRes.statusCode).toBe(200);
        expect(getRes.json().remainingReads).toBeNull();
      }
    });
  });
});
