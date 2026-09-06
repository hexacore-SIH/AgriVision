import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { haversineDistanceKm } from "../../lib/geo.js";

const mandiSchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  district: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const nearestQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export default async function mandisRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.get("/mandis", { preHandler: fastify.requireAuth }, async (request, reply) => {
    const { includeInactive } = request.query as { includeInactive?: string };
    const showInactive = includeInactive === "true" && request.user.role === "ADMIN";

    const mandis = await prisma.mandi.findMany({
      where: showInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });
    return reply.send(mandis);
  });

  fastify.get(
    "/mandis/nearest",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const query = nearestQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.code(400).send({ error: "lat and lng are required" });
      }

      const mandis = await prisma.mandi.findMany({ where: { isActive: true } });

      const withDistance = mandis.map((mandi) => ({
        ...mandi,
        distanceKm:
          mandi.latitude !== null && mandi.longitude !== null
            ? Math.round(
                haversineDistanceKm(query.data.lat, query.data.lng, mandi.latitude, mandi.longitude) * 10
              ) / 10
            : null,
      }));

      withDistance.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      return reply.send(withDistance.slice(0, query.data.limit ?? 20));
    }
  );

  fastify.post(
    "/mandis",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const body = mandiSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }
      const mandi = await prisma.mandi.create({ data: body.data });
      return reply.code(201).send(mandi);
    }
  );

  fastify.patch(
    "/mandis/:id",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = mandiSchema.partial().safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }
      const mandi = await prisma.mandi.update({ where: { id }, data: body.data });
      return reply.send(mandi);
    }
  );

  // "Remove" is a soft delete: existing price history and listings tied to
  // this mandi are never destroyed, the mandi just stops showing up for
  // farmers/mandi heads (GET /mandis excludes it by default) and can no
  // longer be selected for new listings or price updates.
  fastify.delete(
    "/mandis/:id",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const mandi = await prisma.mandi.update({ where: { id }, data: { isActive: false } });
      return reply.send(mandi);
    }
  );

  fastify.post(
    "/mandis/:id/restore",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const mandi = await prisma.mandi.update({ where: { id }, data: { isActive: true } });
      return reply.send(mandi);
    }
  );
}
