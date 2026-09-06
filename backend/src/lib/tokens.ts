import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const REFRESH_TTL_DAYS = 30;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(
  prisma: PrismaClient,
  userId: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  return token;
}

export async function rotateRefreshToken(
  prisma: PrismaClient,
  presentedToken: string
): Promise<{ userId: string; newToken: string } | null> {
  const tokenHash = hashToken(presentedToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const newToken = await issueRefreshToken(prisma, existing.userId);

  return { userId: existing.userId, newToken };
}

export async function revokeRefreshToken(
  prisma: PrismaClient,
  presentedToken: string
): Promise<void> {
  const tokenHash = hashToken(presentedToken);
  await prisma.refreshToken
    .updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}
