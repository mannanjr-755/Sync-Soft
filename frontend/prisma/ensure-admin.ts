/**
 * Safe production upsert — creates/updates the Sync admin without wiping data.
 * Run: npx tsx prisma/ensure-admin.ts  (from frontend/)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@sync.com";
const ADMIN_PASSWORD = "sync@123";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  let restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ slug: "sync" }, { name: "Sync" }] },
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.findFirst({ orderBy: { createdAt: "asc" } });
  }

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: "Sync",
        slug: "sync",
        logo: "/logo.png",
        description: "Sync kitchen dashboard",
      },
    });
    console.log("Created Sync restaurant");
  } else if (restaurant.name !== "Sync" || restaurant.slug !== "sync") {
    restaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { name: "Sync", slug: "sync", logo: restaurant.logo || "/logo.png" },
    });
    console.log("Updated restaurant branding to Sync");
  }

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        name: "Admin",
        role: "ADMIN",
        active: true,
        restaurantId: restaurant.id,
      },
    });
    console.log(`Updated admin: ${ADMIN_EMAIL}`);
  } else {
    // Migrate legacy admin email if present
    const legacy = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "admin@delhidarbar.com" },
          { role: "ADMIN", restaurantId: restaurant.id },
        ],
      },
    });

    if (legacy) {
      await prisma.user.update({
        where: { id: legacy.id },
        data: {
          email: ADMIN_EMAIL,
          passwordHash,
          name: "Admin",
          role: "ADMIN",
          active: true,
          restaurantId: restaurant.id,
        },
      });
      console.log(`Migrated admin ${legacy.email} → ${ADMIN_EMAIL}`);
    } else {
      await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          passwordHash,
          name: "Admin",
          role: "ADMIN",
          restaurantId: restaurant.id,
        },
      });
      console.log(`Created admin: ${ADMIN_EMAIL}`);
    }
  }

  const tableCount = await prisma.table.count({ where: { restaurantId: restaurant.id } });
  if (tableCount === 0) {
    for (let n = 1; n <= 12; n++) {
      await prisma.table.create({
        data: {
          restaurantId: restaurant.id,
          tableNumber: n,
          uniqueCode: `sync-t${n}-${Math.random().toString(36).slice(2, 8)}`,
          active: true,
        },
      });
    }
    console.log("Created 12 demo tables");
  }

  console.log("Done. Admin login: admin@sync.com / sync@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
