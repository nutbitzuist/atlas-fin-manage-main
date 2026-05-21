import type { FinancialHealthHistoryInsert, FinancialHealthHistoryRow } from "@/data/financial-health-history-queries";
import {
  createHealthHistoryEntryRaw,
  getHealthHistoryByUserAndDateRaw,
  getHealthHistoryByUserRaw,
} from "@/data/financial-health-history-queries";

export type { FinancialHealthHistoryInsert, FinancialHealthHistoryRow } from "@/data/financial-health-history-queries";

export async function getHealthHistoryByUser(
  userId: string,
  options: {
    orderBy?: "date";
    ascending?: boolean;
    limit?: number;
  } = {},
) {
  return getHealthHistoryByUserRaw(userId, options);
}

export async function getHealthHistoryByUserAndDate(
  userId: string,
  date: string,
) {
  return getHealthHistoryByUserAndDateRaw(userId, date);
}

export async function createHealthHistoryEntry(entry: FinancialHealthHistoryInsert) {
  return createHealthHistoryEntryRaw(entry);
}
