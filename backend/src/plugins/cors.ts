import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export default fp(async (fastify: FastifyInstance) => {
  const rawOrigin = env.frontendOrigin;
  const origins = rawOrigin.includes(",")
    ? rawOrigin.split(",").map((s) => s.trim())
    : rawOrigin === "*"
      ? true
      : rawOrigin;

  await fastify.register(cors, {
    origin: origins,
    credentials: true,
  });
});
