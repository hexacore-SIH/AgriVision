import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ROLES } from "@agrivision/shared-types";

const promoteSchema = z.object({
  role: z.enum(ROLES),
  mandiId: z.string().optional(),
});

export default async function adminRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.patch(
    "/admin/users/:id/role",
    { preHandler: fastify.requireRole("ADMIN") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = promoteSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }

      if (body.data.role === "MANDI_HEAD" && !body.data.mandiId) {
        return reply.code(400).send({ error: "mandiId is required for MANDI_HEAD" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          role: body.data.role,
          mandiId: body.data.role === "MANDI_HEAD" ? body.data.mandiId : null,
        },
      });

      return reply.send({
        id: user.id,
        phone: user.phone,
        role: user.role,
        mandiId: user.mandiId,
      });
    }
  );

  fastify.get(
    "/admin/users",
    { preHandler: fastify.requireRole("ADMIN") },
    async (_request, reply) => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          mandiId: true,
          preferredLanguage: true,
          createdAt: true,
        },
      });
      return reply.send(users);
    }
  );
}
