import { prisma } from "@/lib/prisma";

/** Generate next order number for a restaurant, e.g. BH-0001 */
export async function generateOrderNumber(restaurantId: string, slug: string): Promise<string> {
  const prefix = slug
    .split("-")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3) || "ORD";

  // Max suffix + 1 — not count + 1. Deletions leave gaps, so count-based
  // numbers can collide with @@unique([restaurantId, orderNumber]).
  const existing = await prisma.order.findMany({
    where: { restaurantId, orderNumber: { startsWith: `${prefix}-` } },
    select: { orderNumber: true },
  });

  let max = 0;
  const prefixLen = prefix.length + 1;
  for (const { orderNumber } of existing) {
    const n = Number.parseInt(orderNumber.slice(prefixLen), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}
