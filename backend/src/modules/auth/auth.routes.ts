import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { LANGUAGES } from "@agrivision/shared-types";
import { createOtp, verifyOtp } from "./otp.service.js";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../../lib/tokens.js";
import { isProduction } from "../../config/env.js";

const phoneSchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/[\s\-()]/g, ""))
    .pipe(z.string().min(8, "Phone number must be at least 8 digits").max(15, "Phone number cannot exceed 15 digits")),
});
const verifySchema = z.object({
  phone: z
    .string()
    .transform((val) => val.replace(/[\s\-()]/g, ""))
    .pipe(z.string().min(8).max(15)),
  code: z.string().trim().length(6, "OTP must be 6 digits"),
});
const patchMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferredLanguage: z.enum(LANGUAGES).optional(),
  mandiId: z.string().optional(),
});

const REFRESH_COOKIE = "agrivision_refresh";

export default async function authRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    secure: isProduction,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  };

  fastify.post("/auth/otp/request", async (request, reply) => {
    const body = phoneSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: body.error.errors[0]?.message || "Invalid phone number" });
    }

    const code = await createOtp(prisma, body.data.phone);
    const exposeDevOtp = process.env.EXPOSE_DEV_OTP !== "false";

    return reply.send({
      message: "OTP sent",
      ...(exposeDevOtp ? { devOtp: code } : {}),
    });
  });

  fastify.post("/auth/otp/verify", async (request, reply) => {
    const body = verifySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: body.error.errors[0]?.message || "Invalid phone or OTP code" });
    }

    const { phone, code } = body.data;
    const ok = await verifyOtp(prisma, phone, code);
    if (!ok) {
      return reply.code(401).send({ error: "Invalid or expired code" });
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone, role: "FARMER" } });
    }

    const accessToken = await reply.jwtSign(
      { sub: user.id, role: user.role, mandiId: user.mandiId },
      { expiresIn: "15m" }
    );
    const refreshToken = await issueRefreshToken(prisma, user.id);

    reply.setCookie(REFRESH_COOKIE, refreshToken, cookieOptions);

    return reply.send({
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        mandiId: user.mandiId,
      },
    });
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const presented = request.cookies[REFRESH_COOKIE];
    if (!presented) {
      return reply.code(401).send({ error: "No refresh token" });
    }

    const rotated = await rotateRefreshToken(prisma, presented);
    if (!rotated) {
      return reply.code(401).send({ error: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
    if (!user) {
      return reply.code(401).send({ error: "User not found" });
    }

    const accessToken = await reply.jwtSign(
      { sub: user.id, role: user.role, mandiId: user.mandiId },
      { expiresIn: "15m" }
    );

    reply.setCookie(REFRESH_COOKIE, rotated.newToken, cookieOptions);

    return reply.send({ accessToken });
  });

  fastify.post("/auth/logout", async (request, reply) => {
    const presented = request.cookies[REFRESH_COOKIE];
    if (presented) {
      await revokeRefreshToken(prisma, presented);
    }
    reply.clearCookie(REFRESH_COOKIE, { path: "/" });
    return reply.send({ message: "Logged out" });
  });

  fastify.get(
    "/auth/me",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }
      return reply.send({
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        mandiId: user.mandiId,
      });
    }
  );

  fastify.patch(
    "/auth/me",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const body = patchMeSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }

      const data: Record<string, unknown> = {};
      if (body.data.name !== undefined) data.name = body.data.name;
      if (body.data.preferredLanguage !== undefined) {
        data.preferredLanguage = body.data.preferredLanguage;
      }
      if (body.data.mandiId !== undefined && request.user.role === "FARMER") {
        data.mandiId = body.data.mandiId;
      }

      const user = await prisma.user.update({
        where: { id: request.user.sub },
        data,
      });

      return reply.send({
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        mandiId: user.mandiId,
      });
    }
  );
}
