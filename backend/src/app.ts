// src/app.ts
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { registerCors } from "./plugins/cors";
import { healthRoutes } from "./routes/health";
import { capsuleRoutes } from "./routes/capsules";

export function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 2 * 1024 * 1024,
  });

  // Global Rate Limiter: max 100 requests per 1 minute per IP
  app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  registerCors(app);
  app.register(healthRoutes);
  app.register(capsuleRoutes);

  return app;
}