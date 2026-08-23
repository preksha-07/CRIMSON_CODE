// src/app.ts
import Fastify from "fastify";
import { registerCors } from "./plugins/cors";
import { healthRoutes } from "./routes/health";
import { capsuleRoutes } from "./routes/capsules";

export function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 2 * 1024 * 1024, // 2MB maximum payload limit
  });

  // Plugins
  registerCors(app);

  // Routes
  app.register(healthRoutes);
  app.register(capsuleRoutes);

  return app;
}