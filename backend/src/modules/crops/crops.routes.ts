import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { UNITS } from "@agrivision/shared-types";

const cropSchema = z.object({
  slug: z.string().min(1),
  defaultUnit: z.enum(UNITS),
  localNames: z.record(z.string(), z.string()),
});

export default async function cropsRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.get("/crops", { preHandler: fastify.requireAuth }, async (_request, reply) => {
    const crops = await prisma.crop.findMany({ orderBy: { slug: "asc" } });
    return reply.send(crops);
  });

  fastify.post(
    "/crops",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const body = cropSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }
      const crop = await prisma.crop.create({ data: body.data });
      return reply.code(201).send(crop);
    }
  );

  fastify.patch(
    "/crops/:id",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = cropSchema.partial().safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }
      const crop = await prisma.crop.update({ where: { id }, data: body.data });
      return reply.send(crop);
    }
  );
}
