import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  return Math.floor(Math.random() * max)
    .toString()
    .padStart(OTP_LENGTH, "0");
}

export async function createOtp(prisma: PrismaClient, phone: string): Promise<string> {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt },
  });

  console.log(`[DEV OTP] ${phone}: ${code}`);

  return code;
}

export async function verifyOtp(
  prisma: PrismaClient,
  phone: string,
  code: string
): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.attempts >= MAX_ATTEMPTS) {
    return false;
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);

  if (!isValid) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return true;
}
