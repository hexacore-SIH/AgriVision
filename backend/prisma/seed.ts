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

// Approximate city-centre coordinates -- good enough to place a marker and
// compute a plausible "nearest mandi" distance, not the exact market gate.
const MANDIS: Array<{
  id: string;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  priceMultiplier: number;
}> = [
  {
    id: "seed-mandi-pune",
    name: "Pune APMC Mandi",
    state: "Maharashtra",
    district: "Pune",
    latitude: 18.4933,
    longitude: 73.8697,
    priceMultiplier: 1,
  },
  {
    id: "seed-mandi-nashik",
    name: "Nashik APMC Mandi",
    state: "Maharashtra",
    district: "Nashik",
    latitude: 20.0059,
    longitude: 73.7997,
    priceMultiplier: 1.05,
  },
  {
    id: "seed-mandi-solapur",
    name: "Solapur APMC Mandi",
    state: "Maharashtra",
    district: "Solapur",
    latitude: 17.6599,
    longitude: 75.9064,
    priceMultiplier: 0.94,
  },
  {
    id: "seed-mandi-ahmednagar",
    name: "Ahmednagar APMC Mandi",
    state: "Maharashtra",
    district: "Ahmednagar",
    latitude: 19.0948,
    longitude: 74.748,
    priceMultiplier: 0.98,
  },
];

async function main() {
  const mandis = [];
  for (const m of MANDIS) {
    const mandi = await prisma.mandi.upsert({
      where: { id: m.id },
      update: {
        name: m.name,
        state: m.state,
        district: m.district,
        latitude: m.latitude,
        longitude: m.longitude,
      },
      create: {
        id: m.id,
        name: m.name,
        state: m.state,
        district: m.district,
        latitude: m.latitude,
        longitude: m.longitude,
      },
    });
    mandis.push({ ...mandi, priceMultiplier: m.priceMultiplier });
  }
  const homeMandi = mandis[0];

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
    update: { role: "MANDI_HEAD", mandiId: homeMandi.id },
    create: {
      phone: "9999900001",
      name: "Mandi Head",
      role: "MANDI_HEAD",
      mandiId: homeMandi.id,
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
    update: { mandiId: homeMandi.id },
    create: {
      phone: "9999900002",
      name: "Demo Farmer",
      role: "FARMER",
      mandiId: homeMandi.id,
      preferredLanguage: "mr_IN",
    },
  });

  for (const mandi of mandis) {
    const updatedById = mandi.id === homeMandi.id ? mandiHead.id : admin.id;

    for (let i = 0; i < crops.length; i++) {
      const crop = crops[i];
      await prisma.mandiCrop.upsert({
        where: { mandiId_cropId: { mandiId: mandi.id, cropId: crop.id } },
        update: {},
        create: { mandiId: mandi.id, cropId: crop.id, displayOrder: i + 1 },
      });

      const basePrice = 1500 + i * 200;
      const startingPrice = Math.round(basePrice * mandi.priceMultiplier);
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
            updatedById,
          },
        });
      }
    }
  }

  console.log("Seeded:", {
    mandis: mandis.map((m) => m.name),
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
