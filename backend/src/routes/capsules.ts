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

// Inside src/routes/capsules.ts for GET /api/capsules/:id

app.get("/api/capsules/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  try {
    // Atomic check-and-decrement query
    const updateQuery = `
      UPDATE capsules
      SET remaining_reads = CASE 
        WHEN remaining_reads IS NOT NULL THEN remaining_reads - 1 
        ELSE NULL 
      END
      WHERE id = $1 
        AND expires_at > NOW() 
        AND (remaining_reads IS NULL OR remaining_reads > 0)
      RETURNING id, ciphertext, metadata, expires_at AS "expiresAt", remaining_reads AS "remainingReads";
    `;

    const result = await pool.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      // Check if it existed to give the correct 410 vs 404 response
      const checkQuery = `SELECT expires_at, remaining_reads FROM capsules WHERE id = $1;`;
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return reply.status(404).send({ error: "Capsule not found" });
      }

      const existing = checkResult.rows[0];
      if (new Date(existing.expires_at) <= new Date()) {
        return reply.status(410).send({ error: "Capsule expired" });
      }

      if (existing.remaining_reads !== null && existing.remaining_reads <= 0) {
        return reply.status(410).send({ error: "Max read limit reached" });
      }

      return reply.status(404).send({ error: "Capsule unavailable" });
    }

    return reply.status(200).send(result.rows[0]);
  } catch (err) {
    app.log.error(err);
    return reply.status(500).send({ error: "Failed to retrieve capsule" });
  }
});
}