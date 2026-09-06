import type { PrismaClient } from "@prisma/client";

export async function getLatestPrice(prisma: PrismaClient, mandiId: string, cropId: string) {
  return prisma.mandiPrice.findFirst({
    where: { mandiId, cropId },
    orderBy: { createdAt: "desc" },
    include: { crop: true, mandi: true },
  });
}

export async function getLatestPriceByCropSlug(
  prisma: PrismaClient,
  mandiId: string,
  cropSlug: string
) {
  const crop = await prisma.crop.findUnique({ where: { slug: cropSlug } });
  if (!crop) return null;
  return getLatestPrice(prisma, mandiId, crop.id);
}

export async function getMandiCropsWithLatestPrice(prisma: PrismaClient, mandiId: string) {
  const mandiCrops = await prisma.mandiCrop.findMany({
    where: { mandiId },
    orderBy: { displayOrder: "asc" },
    include: { crop: true },
  });

  const results = [];
  for (const mc of mandiCrops) {
    const latest = await prisma.mandiPrice.findFirst({
      where: { mandiId, cropId: mc.cropId },
      orderBy: { createdAt: "desc" },
    });
    results.push({
      mandiCropId: mc.id,
      cropId: mc.cropId,
      cropSlug: mc.crop.slug,
      localNames: mc.crop.localNames,
      unit: latest?.unit ?? mc.crop.defaultUnit,
      displayOrder: mc.displayOrder,
      isActive: mc.isActive,
      currentPrice: latest ? Number(latest.pricePerUnit) : null,
      lastUpdatedAt: latest?.createdAt ?? null,
    });
  }
  return results;
}
