import type { FastifyInstance } from "fastify";
import { z } from "zod";

const mandiSchema = z.object({
  name: z.string().min(1),
  state: z.string().min(1),
  district: z.string().optional(),
});

export default async function mandisRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.get("/mandis", { preHandler: fastify.requireAuth }, async (_request, reply) => {
    const mandis = await prisma.mandi.findMany({ orderBy: { name: "asc" } });
    return reply.send(mandis);
  });

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
}
