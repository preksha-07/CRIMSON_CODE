// src/plugins/cors.ts
import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}