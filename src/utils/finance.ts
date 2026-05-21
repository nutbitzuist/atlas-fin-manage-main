import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";
import { upsertNetWorthSnapshot } from "@/services/net-worth-history-service";

/**
 * Backward-compatible aggregate wrapper for existing callers.
 * Calculates current total assets and total liabilities for a user.
 * Newer code should call financial-overview-service directly.
 */
export async function calculateTotals(userId: string) {
  const [assetSummary, liabilitySummary] = await Promise.all([
    getAssetSummary(userId),
    getLiabilitySummary(userId),
  ]);

  const totalAssets = assetSummary.totalAssets;
  const totalLiabilities = liabilitySummary.totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities
  };
}

/**
 * Saves a historical snapshot of the user's net worth to the database.
 */
export async function saveSnapshot(userId: string) {
  const totals = await calculateTotals(userId);
  const today = new Date().toISOString().split("T")[0];

  return upsertNetWorthSnapshot(userId, {
    date: today,
    totalAssets: totals.totalAssets,
    totalLiabilities: totals.totalLiabilities,
  });
}
