import Fastify from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { env } from "./config/env.js";
import corsPlugin from "./plugins/cors.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import mandisRoutes from "./modules/mandis/mandis.routes.js";
import cropsRoutes from "./modules/crops/crops.routes.js";
import pricesRoutes from "./modules/prices/prices.routes.js";
import listingsRoutes from "./modules/listings/listings.routes.js";
import voiceRoutes from "./modules/voice/voice.routes.js";
import profitCalculatorRoutes from "./modules/tools/profitCalculator.routes.js";

async function main() {
  const fastify = Fastify({ logger: true });

  await fastify.register(corsPlugin);
  await fastify.register(cookie);
  await fastify.register(multipart);
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  fastify.get("/", async () => ({ message: "AgriVision API is running" }));

  await fastify.register(authRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(mandisRoutes);
  await fastify.register(cropsRoutes);
  await fastify.register(pricesRoutes);
  await fastify.register(listingsRoutes);
  await fastify.register(voiceRoutes);
  await fastify.register(profitCalculatorRoutes);

  await fastify.listen({ port: env.port, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
