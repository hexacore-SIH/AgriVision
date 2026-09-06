import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CROPS: Array<{
  slug: string;
  defaultUnit: "KG" | "QUINTAL" | "TON";
  localNames: Record<string, string>;
}> = [
  {
    slug: "wheat",
    defaultUnit: "QUINTAL",
    localNames: { hi: "गेहूं", mr: "गहू", pa: "ਕਣਕ", gu: "ઘઉં", en: "Wheat" },
  },
  {
    slug: "rice",
    defaultUnit: "QUINTAL",
    localNames: { hi: "चावल", mr: "तांदूळ", pa: "ਚੌਲ", gu: "ચોખા", en: "Rice" },
  },
  {
    slug: "onion",
    defaultUnit: "KG",
    localNames: { hi: "प्याज", mr: "कांदा", pa: "ਪਿਆਜ਼", gu: "ડુંગળી", en: "Onion" },
  },
  {
    slug: "potato",
    defaultUnit: "KG",
    localNames: { hi: "आलू", mr: "बटाटा", pa: "ਆਲੂ", gu: "બટાકા", en: "Potato" },
  },
  {
    slug: "tomato",
    defaultUnit: "KG",
    localNames: { hi: "टमाटर", mr: "टोमॅटो", pa: "ਟਮਾਟਰ", gu: "ટામેટા", en: "Tomato" },
  },
  {
    slug: "cotton",
    defaultUnit: "QUINTAL",
    localNames: { hi: "कपास", mr: "कापूस", pa: "ਕਪਾਹ", gu: "કપાસ", en: "Cotton" },
  },
  {
    slug: "sugarcane",
    defaultUnit: "TON",
    localNames: { hi: "गन्ना", mr: "ऊस", pa: "ਗੰਨਾ", gu: "શેરડી", en: "Sugarcane" },
  },
  {
    slug: "soybean",
    defaultUnit: "QUINTAL",
    localNames: { hi: "सोयाबीन", mr: "सोयाबीन", pa: "ਸੋਇਆਬੀਨ", gu: "સોયાબીન", en: "Soybean" },
  },
  {
    slug: "maize",
    defaultUnit: "QUINTAL",
    localNames: { hi: "मक्का", mr: "मका", pa: "ਮੱਕੀ", gu: "મકાઈ", en: "Maize" },
  },
  {
    slug: "chana",
    defaultUnit: "QUINTAL",
    localNames: { hi: "चना", mr: "हरभरा", pa: "ਛੋਲੇ", gu: "ચણા", en: "Chickpea" },
  },
];

async function main() {
  const mandi = await prisma.mandi.upsert({
    where: { id: "seed-mandi-pune" },
    update: {},
    create: {
      id: "seed-mandi-pune",
      name: "Pune APMC Mandi",
      state: "Maharashtra",
      district: "Pune",
    },
  });

  const crops = [];
  for (const c of CROPS) {
    const crop = await prisma.crop.upsert({
      where: { slug: c.slug },
      update: { defaultUnit: c.defaultUnit, localNames: c.localNames },
      create: c,
    });
    crops.push(crop);
  }

  const mandiHead = await prisma.user.upsert({
    where: { phone: "9999900001" },
    update: { role: "MANDI_HEAD", mandiId: mandi.id },
    create: {
      phone: "9999900001",
      name: "Mandi Head",
      role: "MANDI_HEAD",
      mandiId: mandi.id,
      preferredLanguage: "hi_IN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: "9999900000" },
    update: { role: "ADMIN" },
    create: {
      phone: "9999900000",
      name: "Admin",
      role: "ADMIN",
      preferredLanguage: "en_IN",
    },
  });

  const farmer = await prisma.user.upsert({
    where: { phone: "9999900002" },
    update: { mandiId: mandi.id },
    create: {
      phone: "9999900002",
      name: "Demo Farmer",
      role: "FARMER",
      mandiId: mandi.id,
      preferredLanguage: "mr_IN",
    },
  });

  for (let i = 0; i < crops.length; i++) {
    const crop = crops[i];
    await prisma.mandiCrop.upsert({
      where: { mandiId_cropId: { mandiId: mandi.id, cropId: crop.id } },
      update: {},
      create: { mandiId: mandi.id, cropId: crop.id, displayOrder: i + 1 },
    });

    const startingPrice = 1500 + i * 200;
    const existing = await prisma.mandiPrice.findFirst({
      where: { mandiId: mandi.id, cropId: crop.id },
    });
    if (!existing) {
      await prisma.mandiPrice.create({
        data: {
          mandiId: mandi.id,
          cropId: crop.id,
          pricePerUnit: startingPrice,
          unit: crop.defaultUnit,
          updatedById: mandiHead.id,
        },
      });
    }
  }

  console.log("Seeded:", {
    mandi: mandi.name,
    crops: crops.length,
    admin: admin.phone,
    mandiHead: mandiHead.phone,
    farmer: farmer.phone,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
