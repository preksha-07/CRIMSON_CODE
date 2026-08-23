import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { pool } from "../db/pool";
import { createCapsuleSchema } from "../schemas/capsuleSchemas";

export async function capsuleRoutes(app: FastifyInstance) {
  // Real POST /api/capsules
  app.post("/api/capsules", async (request, reply) => {
    const parseResult = createCapsuleSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation Error",
        details: parseResult.error.flatten(),
      });
    }

    const { ciphertext, metadata, expiresAt, maxReads } = parseResult.data;
    
    // Generate an opaque, cryptographically random ID
    const id = randomBytes(12).toString("hex");

    const query = `
      INSERT INTO capsules (id, ciphertext, metadata, expires_at, max_reads, remaining_reads)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, expires_at AS "expiresAt";
    `;

    try {
      const result = await pool.query(query, [
        id,
        ciphertext,
        JSON.stringify(metadata),
        expiresAt,
        maxReads,
        maxReads,
      ]);

      return reply.status(201).send(result.rows[0]);
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create capsule" });
    }
  });

  // Real GET /api/capsules/:id
  // Inside GET /api/capsules/:id in src/routes/capsules.ts

app.get("/api/capsules/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  try {
    const result = await pool.query(
      `SELECT id, ciphertext, metadata, expires_at AS "expiresAt", remaining_reads AS "remainingReads"
       FROM capsules WHERE id = $1`,
      [id]
    );

    // 1. Not Found Check
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: "Capsule not found" });
    }

    const capsule = result.rows[0];

    // 2. Server-Time Expiry Check
    const now = new Date();
    const expiryTime = new Date(capsule.expiresAt);

    if (expiryTime <= now) {
      // Return 410 Gone to trigger VIXEN's CapsuleExpired page
      return reply.status(410).send({ error: "Capsule expired" });
    }

    // 3. Return Payload if Valid
    return reply.status(200).send(capsule);
  } catch (err) {
    app.log.error(err);
    return reply.status(500).send({ error: "Failed to retrieve capsule" });
  }
});
}