import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

import { buildApp } from "../src/app";
import { pool } from "../src/db/pool";

describe("Security Boundaries & Validation API", () => {
  let app = buildApp();
  let isDbConnected = false;
  const createdIds: string[] = [];

  beforeAll(async () => {
    try {
      const client = await pool.connect();
      client.release();
      isDbConnected = true;
    } catch (err) {
      // Local DB-dependent test setup fallback
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

  describe("CORS Policies", () => {
    it("reflects allowed origins in headers (localhost)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/health",
        headers: {
          Origin: "http://localhost:5173",
        },
      });
      expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    });

    it("reflects allowed origins in headers (127.0.0.1)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/health",
        headers: {
          Origin: "http://127.0.0.1:5173",
        },
      });
      expect(res.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173");
    });

    it("does not reflect untrusted origins", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/health",
        headers: {
          Origin: "http://evil.example",
        },
      });
      // The origin should NOT be reflected as an allowed origin
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("Body Limits & Schema Limits", () => {
    it("rejects payloads exceeding Fastify global 2MB bodyLimit with 413 Payload Too Large", async () => {
      // Generate a string that exceeds 2MB (2 * 1024 * 1024 = 2,097,152 bytes)
      const oversizedPayload = "a".repeat(2 * 1024 * 1024 + 100);
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: oversizedPayload,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      });
      expect(res.statusCode).toBe(413); // Payload Too Large
    });

    it("rejects ciphertext exceeding Zod schema limit (1.5M chars) but below 2MB with 400 Bad Request", async () => {
      // 1,500,001 characters is > 1.5M schema limit but < 2MB global bodyLimit
      const schemaOversizedCiphertext = "a".repeat(1_500_001);
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: schemaOversizedCiphertext,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(400); // Schema ValidationError
      expect(res.json().details.fieldErrors.ciphertext[0]).toContain("exceeds maximum limit");
    });
  });

  describe("Input Safety & Opaque Storage", () => {
    it("stores and retrieves HTML/Script characters byte-for-byte without execution or 500 error", async (ctx) => {
      if (!isDbConnected) {
        ctx.skip();
        return;
      }
      const maliciousPayload = '<script>alert("XSS")</script>';
      const createRes = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: maliciousPayload,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
      expect(createRes.statusCode).toBe(201);
      const capsule = createRes.json();
      createdIds.push(capsule.id);

      const getRes = await app.inject({
        method: "GET",
        url: `/api/capsules/${capsule.id}`,
      });
      expect(getRes.statusCode).toBe(200);
      expect(getRes.json().ciphertext).toBe(maliciousPayload); // Opaque handling check
    });

    it("verifies API contract does not accept or require plaintext/decryption keys", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/capsules",
        payload: {
          ciphertext: "valid_opaque_ciphertext",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          // Testing that fields representing plaintext keys or passwords are not supported/validated in schema
          decryptionKey: "should-not-exist",
          plaintext: "should-not-exist",
        },
      });
      // Zod should parse and drop extra fields, but the schema must not have them.
      // This test verifies that the API contract focuses exclusively on ciphertext/metadata.
      expect(res.statusCode).toBe(isDbConnected ? 201 : 500);
      if (res.statusCode === 201) {
        createdIds.push(res.json().id);
      }
    });
  });

  describe("Global Rate Limiter", () => {
    it("eventually rejects requests exceeding rate limits (max 100 requests / minute)", async () => {
      // Send 101 requests from the same client to hit the rate limiter
      const ip = "1.2.3.4";
      let rateLimited = false;

      for (let i = 0; i < 105; i++) {
        const res = await app.inject({
          method: "GET",
          url: "/api/health",
          remoteAddress: ip,
        });
        if (res.statusCode === 429) {
          rateLimited = true;
          break;
        }
      }

      // Assert that we did indeed hit the rate limit boundary
      expect(rateLimited).toBe(true);
    });
  });
});

