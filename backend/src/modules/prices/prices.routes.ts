import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UNITS } from "@agrivision/shared-types";
import { getLatestPrice, getMandiCropsWithLatestPrice } from "../../lib/priceQueries.js";

const createPriceSchema = z.object({
  cropId: z.string(),
  pricePerUnit: z.number().positive(),
  unit: z.enum(UNITS),
  mandiId: z.string().optional(),
});

const addMandiCropSchema = z.object({ cropId: z.string() });
const reorderSchema = z.object({ orderedMandiCropIds: z.array(z.string()).min(1) });

export default async function pricesRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.get(
    "/mandi-prices",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { mandiId, cropId } = request.query as { mandiId?: string; cropId?: string };
      if (!mandiId || !cropId) {
        return reply.code(400).send({ error: "mandiId and cropId are required" });
      }
      const price = await getLatestPrice(prisma, mandiId, cropId);
      if (!price) {
        return reply.code(404).send({ error: "No price recorded yet" });
      }
      return reply.send({
        cropId: price.cropId,
        cropSlug: price.crop.slug,
        mandiId: price.mandiId,
        mandiName: price.mandi.name,
        pricePerUnit: Number(price.pricePerUnit),
        unit: price.unit,
        updatedAt: price.createdAt,
      });
    }
  );

  fastify.get(
    "/mandi-prices/history",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { mandiId, cropId, days } = request.query as {
        mandiId?: string;
        cropId?: string;
        days?: string;
      };
      if (!mandiId || !cropId) {
        return reply.code(400).send({ error: "mandiId and cropId are required" });
      }
      const since = new Date(Date.now() - Number(days ?? 30) * 24 * 60 * 60 * 1000);
      const rows = await prisma.mandiPrice.findMany({
        where: { mandiId, cropId, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      });
      return reply.send(
        rows.map((row) => ({
          pricePerUnit: Number(row.pricePerUnit),
          unit: row.unit,
          createdAt: row.createdAt,
        }))
      );
    }
  );

  fastify.get(
    "/mandi-crops",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { mandiId } = request.query as { mandiId?: string };
      const targetMandiId = mandiId ?? request.user.mandiId;
      if (!targetMandiId) {
        return reply.code(400).send({ error: "mandiId is required" });
      }
      const rows = await getMandiCropsWithLatestPrice(prisma, targetMandiId);
      return reply.send(rows);
    }
  );

  fastify.post(
    "/mandi-crops",
    { preHandler: fastify.requireRole("MANDI_HEAD") },
    async (request, reply) => {
      const body = addMandiCropSchema.safeParse(request.body);
      if (!body.success || !request.user.mandiId) {
        return reply.code(400).send({ error: "Invalid request" });
      }
      const max = await prisma.mandiCrop.aggregate({
        where: { mandiId: request.user.mandiId },
        _max: { displayOrder: true },
      });
      const mandiCrop = await prisma.mandiCrop.create({
        data: {
          mandiId: request.user.mandiId,
          cropId: body.data.cropId,
          displayOrder: (max._max.displayOrder ?? 0) + 1,
        },
      });
      return reply.code(201).send(mandiCrop);
    }
  );

  fastify.patch(
    "/mandi-crops/reorder",
    { preHandler: fastify.requireRole("MANDI_HEAD") },
    async (request, reply) => {
      const body = reorderSchema.safeParse(request.body);
      if (!body.success || !request.user.mandiId) {
        return reply.code(400).send({ error: "Invalid request" });
      }

      const owned = await prisma.mandiCrop.findMany({
        where: { id: { in: body.data.orderedMandiCropIds }, mandiId: request.user.mandiId },
        select: { id: true },
      });
      if (owned.length !== body.data.orderedMandiCropIds.length) {
        return reply.code(403).send({ error: "Cannot reorder crops outside your mandi" });
      }

      await prisma.$transaction(
        body.data.orderedMandiCropIds.map((id, index) =>
          prisma.mandiCrop.update({ where: { id }, data: { displayOrder: index + 1 } })
        )
      );

      return reply.send({ message: "Reordered" });
    }
  );

  fastify.post(
    "/mandi-prices",
    { preHandler: fastify.requireRole("MANDI_HEAD") },
    async (request, reply) => {
      const body = createPriceSchema.safeParse(request.body);
      if (!body.success || !request.user.mandiId) {
        return reply.code(400).send({ error: "Invalid request" });
      }

      const price = await prisma.mandiPrice.create({
        data: {
          mandiId: request.user.mandiId,
          cropId: body.data.cropId,
          pricePerUnit: body.data.pricePerUnit,
          unit: body.data.unit,
          updatedById: request.user.sub,
        },
        include: { crop: true },
      });

      return reply.code(201).send({
        id: price.id,
        cropId: price.cropId,
        cropSlug: price.crop.slug,
        pricePerUnit: Number(price.pricePerUnit),
        unit: price.unit,
        createdAt: price.createdAt,
      });
    }
  );
}
