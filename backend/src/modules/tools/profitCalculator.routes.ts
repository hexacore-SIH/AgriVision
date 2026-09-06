import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ProfitCalculatorResult, ProfitScenario } from "@agrivision/shared-types";
import { UNITS } from "@agrivision/shared-types";
import {
  COMMISSION_RATE,
  STORAGE_COST_PER_DAY,
  DEFAULT_WAIT_DAYS,
  TREND_LOOKBACK_DAYS,
} from "../../lib/profitConstants.js";

const requestSchema = z.object({
  mandiId: z.string(),
  cropId: z.string(),
  quantity: z.number().positive(),
  unit: z.enum(UNITS),
  waitDays: z.number().int().min(1).max(90).optional(),
});

export default async function profitCalculatorRoutes(fastify: FastifyInstance) {
  const { prisma } = fastify;

  fastify.post(
    "/tools/profit-calculator",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const body = requestSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request" });
      }
      const { mandiId, cropId, quantity, unit } = body.data;
      const waitDays = body.data.waitDays ?? DEFAULT_WAIT_DAYS;

      const [mandi, crop, latestPrice] = await Promise.all([
        prisma.mandi.findUnique({ where: { id: mandiId } }),
        prisma.crop.findUnique({ where: { id: cropId } }),
        prisma.mandiPrice.findFirst({
          where: { mandiId, cropId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      if (!mandi || !crop) {
        return reply.code(404).send({ error: "Mandi or crop not found" });
      }
      if (!latestPrice) {
        return reply.code(404).send({ error: "No price recorded for this crop at this mandi yet" });
      }

      const since = new Date(Date.now() - TREND_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const history = await prisma.mandiPrice.findMany({
        where: { mandiId, cropId, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      });

      const trendPerDayPerUnit = computeDailyTrend(
        history.map((row) => ({ price: Number(row.pricePerUnit), createdAt: row.createdAt }))
      );

      const currentPrice = Number(latestPrice.pricePerUnit);
      const storageCostPerDay = STORAGE_COST_PER_DAY[unit];

      const sellNow: ProfitScenario = buildScenario("SELL_NOW", 0, currentPrice, quantity, 0);

      const projectedPrice = Math.max(0, currentPrice + trendPerDayPerUnit * waitDays);
      const waitAndSell: ProfitScenario = buildScenario(
        "WAIT",
        waitDays,
        projectedPrice,
        quantity,
        storageCostPerDay * quantity * waitDays
      );

      const netDifference = waitAndSell.netRevenue - sellNow.netRevenue;

      const result: ProfitCalculatorResult = {
        cropSlug: crop.slug,
        mandiName: mandi.name,
        quantity,
        unit,
        waitDays,
        trendPerDayPerUnit: Math.round(trendPerDayPerUnit * 100) / 100,
        sellNow,
        waitAndSell,
        recommendation: netDifference > 0 ? "WAIT" : "SELL_NOW",
        netDifference: Math.round(Math.abs(netDifference) * 100) / 100,
      };

      return reply.send(result);
    }
  );
}

function buildScenario(
  label: "SELL_NOW" | "WAIT",
  days: number,
  pricePerUnit: number,
  quantity: number,
  storageCost: number
): ProfitScenario {
  const grossRevenue = pricePerUnit * quantity;
  const commission = grossRevenue * COMMISSION_RATE;
  const netRevenue = grossRevenue - commission - storageCost;

  return {
    label,
    days,
    pricePerUnit: Math.round(pricePerUnit * 100) / 100,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    storageCost: Math.round(storageCost * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
  };
}

// Average daily price change across the lookback window (simple first-to-last
// slope, not a real forecast) -- used only to project a plausible price if
// the farmer waits, not a guarantee.
function computeDailyTrend(points: Array<{ price: number; createdAt: Date }>): number {
  if (points.length < 2) return 0;
  const first = points[0];
  const last = points[points.length - 1];
  const daySpan = (last.createdAt.getTime() - first.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daySpan < 1) return 0;
  return (last.price - first.price) / daySpan;
}
