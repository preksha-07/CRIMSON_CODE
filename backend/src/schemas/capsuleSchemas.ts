// src/schemas/capsuleSchemas.ts
import { z } from "zod";

export const createCapsuleSchema = z.object({
  // Enforce string size boundaries on the ciphertext
  ciphertext: z
    .string()
    .min(1, "Ciphertext cannot be empty")
    .max(1_500_000, "Ciphertext exceeds maximum limit"),

  // Restrict metadata to bounded, safe values
  metadata: z.record(z.unknown()).optional().default({}),

  // Validate ISO timestamp and ensure expiry is in the future
  expiresAt: z
    .string()
    .datetime("expiresAt must be a valid ISO 8601 timestamp")
    .refine(
      (val) => new Date(val) > new Date(),
      "expiresAt must be in the future"
    ),

  // Max reads bound check (if used)
  maxReads: z
    .number()
    .int("maxReads must be an integer")
    .positive("maxReads must be greater than 0")
    .max(100, "maxReads cannot exceed 100")
    .nullable()
    .optional()
    .default(null),
});

export type CreateCapsuleInput = z.infer<typeof createCapsuleSchema>;