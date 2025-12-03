import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function run() {
  const adminEmail = "admin@aicart.local";
  const userEmail = "user@aicart.local";
  const adminPass = await bcrypt.hash("admin123", 10);
  const userPass = await bcrypt.hash("user123", 10);

  await prisma.users.upsert({
    where: { email: adminEmail },
    update: { password_hash: adminPass, role: "admin", name: "Admin" },
    create: { email: adminEmail, password_hash: adminPass, role: "admin", name: "Admin", credits: 1000 },
  });

  await prisma.users.upsert({
    where: { email: userEmail },
    update: { password_hash: userPass, role: "user", name: "User" },
    create: { email: userEmail, password_hash: userPass, role: "user", name: "User", credits: 500 },
  });

  const bgCats = ["Studio", "Indoor", "Luxury", "Urban"];
  for (const c of bgCats) {
    const exists = await prisma.library_categories.findFirst({ where: { type: "backgrounds", name: c } });
    if (!exists) await prisma.library_categories.create({ data: { type: "backgrounds", name: c, bg_color: "#0E1019", accent_color: "#FFB400" } });
  }
  const propsCats = ["Studio", "Indoor", "Luxury", "Urban"];
  for (const c of propsCats) {
    const exists = await prisma.library_categories.findFirst({ where: { type: "props", name: c } });
    if (!exists) await prisma.library_categories.create({ data: { type: "props", name: c, bg_color: "#0E1019", accent_color: "#3b82f6" } });
  }
  const sceneCats = ["Studio", "Outdoor", "Luxury", "Indoor", "Urban", "Nature"];
  for (const c of sceneCats) {
    const exists = await prisma.library_categories.findFirst({ where: { type: "scenes", name: c } });
    if (!exists) await prisma.library_categories.create({ data: { type: "scenes", name: c, bg_color: "#0E1019", accent_color: "#f59e0b" } });
  }

  await prisma.backgrounds_library.createMany({
    data: [
      { name: "Studio Soft Light", category: "Studio", image_url: "https://picsum.photos/seed/studio1/800/600" },
      { name: "Indoor Loft", category: "Indoor", image_url: "https://picsum.photos/seed/indoor1/800/600" },
      { name: "Luxury Marble", category: "Luxury", image_url: "https://picsum.photos/seed/lux1/800/600" },
      { name: "Urban Alley", category: "Urban", image_url: "https://picsum.photos/seed/urban1/800/600" },
    ],
    skipDuplicates: true,
  }).catch(() => {});

  await prisma.props_library.createMany({
    data: [
      { name: "Modern Chair", category: "Studio", image_url: "https://picsum.photos/seed/chair1/400/400" },
      { name: "Indoor Plant", category: "Indoor", image_url: "https://picsum.photos/seed/plant1/400/400" },
      { name: "Luxury Vase", category: "Luxury", image_url: "https://picsum.photos/seed/vase1/400/400" },
      { name: "Urban Sign", category: "Urban", image_url: "https://picsum.photos/seed/sign1/400/400" },
    ],
    skipDuplicates: true,
  }).catch(() => {});

  await (prisma as any).scene_library.createMany({
    data: [
      {
        name: "Minimal White Studio",
        category: "Studio",
        mood: "Clean",
        description: "Soft daylight spilling into a minimal all-white set.",
        image_url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=900&q=80",
        tags: ["studio", "white"],
      },
      {
        name: "Urban Street Lifestyle",
        category: "Urban",
        mood: "Energetic",
        description: "Concrete textures with neon reflections for edgy looks.",
        image_url: "https://images.unsplash.com/photo-1520975918319-258b6a2139f0?w=900&q=80",
        tags: ["urban"],
      },
      {
        name: "Warm Cozy Home Interior",
        category: "Indoor",
        mood: "Warm",
        description: "Living room with natural woods and soft textiles.",
        image_url: "https://images.unsplash.com/photo-1616594039964-ae9021b39d2e?w=900&q=80",
        tags: ["indoor", "cozy"],
      },
      {
        name: "Luxury Gold Aesthetic",
        category: "Luxury",
        mood: "Premium",
        description: "Gold panels and dramatic spotlights for hero shots.",
        image_url: "https://images.unsplash.com/photo-1524699828488-5e27b3b03d9c?w=900&q=80",
        tags: ["luxury"],
      },
      {
        name: "Nature Forest Soft Light",
        category: "Nature",
        mood: "Natural",
        description: "Golden-hour light through towering pines.",
        image_url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
        tags: ["nature"],
      },
      {
        name: "Outdoor Sunny Terrace",
        category: "Outdoor",
        mood: "Bright",
        description: "Mediterranean terrace with harsh noon light.",
        image_url: "https://images.unsplash.com/photo-1524231757912-b50f8a38239a?w=900&q=80",
        tags: ["outdoor"],
      },
    ],
    skipDuplicates: true,
  }).catch(() => {});
}

run().finally(async () => {
  await prisma.$disconnect();
});