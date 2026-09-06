import type { Unit } from "@agrivision/shared-types";

// Typical APMC mandi commission. A flat, configurable estimate -- not fetched
// from any live source, and not specific to any one mandi.
export const COMMISSION_RATE = 0.06;

// Estimated storage cost per day, per unit of produce (INR). Rough
// approximations for a warehouse/cold-storage stay, not real quotes.
export const STORAGE_COST_PER_DAY: Record<Unit, number> = {
  KG: 0.5,
  QUINTAL: 50,
  TON: 500,
};

export const DEFAULT_WAIT_DAYS = 7;
export const TREND_LOOKBACK_DAYS = 30;
