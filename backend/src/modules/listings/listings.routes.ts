import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UNITS, LISTING_STATUSES } from "@agrivision/shared-types";

const createListingSchema = z.object({
  cropId: z.string(),
  quantity: z.number().positive(),
  unit: z.enum(UNITS),
  askingPricePerUnit: z.number().positive().optional(),
  mandiId: z.string().optional(),
});

const updateListingSchema = z.object({
  status: z.enum(LISTING_STATUSES),
});

export default async function listingsRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.post(
    "/listings",
    { preHandler: fastify.requireRole("FARMER") },
    async (request, reply) => {
      const body = createListingSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }

      const listing = await prisma.listing.create({
        data: {
          farmerId: request.user.sub,
          cropId: body.data.cropId,
          quantity: body.data.quantity,
          unit: body.data.unit,
          askingPricePerUnit: body.data.askingPricePerUnit,
          mandiId: body.data.mandiId,
        },
        include: { crop: true },
      });

      return reply.code(201).send({
        id: listing.id,
        cropSlug: listing.crop.slug,
        quantity: Number(listing.quantity),
        unit: listing.unit,
        status: listing.status,
      });
    }
  );

  fastify.get(
    "/listings/mine",
    { preHandler: fastify.requireRole("FARMER") },
    async (request, reply) => {
      const listings = await prisma.listing.findMany({
        where: { farmerId: request.user.sub },
        orderBy: { createdAt: "desc" },
        include: { crop: true },
      });
      return reply.send(
        listings.map((listing) => ({
          id: listing.id,
          cropSlug: listing.crop.slug,
          localNames: listing.crop.localNames,
          quantity: Number(listing.quantity),
          unit: listing.unit,
          askingPricePerUnit: listing.askingPricePerUnit
            ? Number(listing.askingPricePerUnit)
            : null,
          status: listing.status,
          createdAt: listing.createdAt,
        }))
      );
    }
  );

  fastify.get(
    "/listings",
    { preHandler: fastify.requireRole("MANDI_HEAD", "ADMIN") },
    async (request, reply) => {
      const { mandiId, cropId, status } = request.query as {
        mandiId?: string;
        cropId?: string;
        status?: string;
      };
      const targetMandiId =
        request.user.role === "MANDI_HEAD" ? request.user.mandiId ?? undefined : mandiId;

      const listings = await prisma.listing.findMany({
        where: {
          mandiId: targetMandiId,
          cropId,
          status: status as never,
        },
        orderBy: { createdAt: "desc" },
        include: { crop: true, farmer: true },
      });

      return reply.send(
        listings.map((listing) => ({
          id: listing.id,
          farmerName: listing.farmer.name,
          farmerPhone: listing.farmer.phone,
          cropSlug: listing.crop.slug,
          quantity: Number(listing.quantity),
          unit: listing.unit,
          askingPricePerUnit: listing.askingPricePerUnit
            ? Number(listing.askingPricePerUnit)
            : null,
          status: listing.status,
          createdAt: listing.createdAt,
        }))
      );
    }
  );

  fastify.patch(
    "/listings/:id",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateListingSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }

      const listing = await prisma.listing.findUnique({ where: { id } });
      if (!listing) {
        return reply.code(404).send({ error: "Listing not found" });
      }
      if (listing.farmerId !== request.user.sub && request.user.role !== "ADMIN") {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const updated = await prisma.listing.update({
        where: { id },
        data: { status: body.data.status },
      });

      return reply.send({ id: updated.id, status: updated.status });
    }
  );
}
