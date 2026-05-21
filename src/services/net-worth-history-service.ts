import type {
  NetWorthHistoryInsert,
  NetWorthHistoryRow,
  NetWorthHistoryUpdate,
} from "@/data/net-worth-history-queries";
import {
  createNetWorthSnapshotRaw,
  getNetWorthHistoryByUserRaw,
  getNetWorthSnapshotForMonthRaw,
  updateNetWorthSnapshotRaw,
} from "@/data/net-worth-history-queries";

export type {
  NetWorthHistoryInsert,
  NetWorthHistoryRow,
  NetWorthHistoryUpdate,
} from "@/data/net-worth-history-queries";

export type NetWorthHistoryQueryOptions = {
  startDate?: string;
  endDate?: string;
  orderBy?: "date";
  ascending?: boolean;
  limit?: number;
};

export async function getNetWorthHistoryByUser(
  userId: string,
  options: NetWorthHistoryQueryOptions = {},
) {
  return getNetWorthHistoryByUserRaw(userId, options);
}

export async function getNetWorthSnapshotForMonth(
  userId: string,
  monthStart: string,
) {
  return getNetWorthSnapshotForMonthRaw(userId, monthStart);
}

export async function upsertNetWorthSnapshot(
  userId: string,
  snapshot: {
    date: string;
    totalAssets: number;
    totalLiabilities: number;
  },
) {
  const { date, totalAssets, totalLiabilities } = snapshot;
  const netWorth = totalAssets - totalLiabilities;
  const existing = await getNetWorthSnapshotForMonth(userId, `${date}-01`);

  if (existing) {
    await updateNetWorthSnapshotRaw(existing.id, userId, {
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: netWorth,
    });
    return existing;
  }

  const payload: NetWorthHistoryInsert = {
    user_id: userId,
    date,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    net_worth: netWorth,
    currency: "THB",
  };

  return createNetWorthSnapshotRaw(payload);
}
