-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'MANDI_HEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('hi_IN', 'mr_IN', 'pa_IN', 'gu_IN', 'en_IN');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'QUINTAL', 'TON');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'SOLD', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "preferredLanguage" "Language" NOT NULL DEFAULT 'hi_IN',
    "mandiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mandi" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mandi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "defaultUnit" "Unit" NOT NULL DEFAULT 'KG',
    "localNames" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandiCrop" (
    "id" TEXT NOT NULL,
    "mandiId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MandiCrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandiPrice" (
    "id" TEXT NOT NULL,
    "mandiId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "unit" "Unit" NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MandiPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "Unit" NOT NULL,
    "askingPricePerUnit" DECIMAL(10,2),
    "mandiId" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceInteractionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "transcript" TEXT NOT NULL,
    "detectedLanguage" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "entities" JSONB NOT NULL,
    "finalReplyText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceInteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "OtpCode_phone_expiresAt_idx" ON "OtpCode"("phone", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_slug_key" ON "Crop"("slug");

-- CreateIndex
CREATE INDEX "MandiCrop_mandiId_displayOrder_idx" ON "MandiCrop"("mandiId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MandiCrop_mandiId_cropId_key" ON "MandiCrop"("mandiId", "cropId");

-- CreateIndex
CREATE INDEX "MandiPrice_mandiId_cropId_createdAt_idx" ON "MandiPrice"("mandiId", "cropId", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_farmerId_status_idx" ON "Listing"("farmerId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "Mandi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandiCrop" ADD CONSTRAINT "MandiCrop_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "Mandi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandiCrop" ADD CONSTRAINT "MandiCrop_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandiPrice" ADD CONSTRAINT "MandiPrice_mandiId_fkey" FOREIGN KEY ("mandiId") REFERENCES "Mandi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandiPrice" ADD CONSTRAINT "MandiPrice_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandiPrice" ADD CONSTRAINT "MandiPrice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceInteractionLog" ADD CONSTRAINT "VoiceInteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
