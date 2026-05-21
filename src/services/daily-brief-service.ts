import type { DailyBriefInsert, DailyBriefRow, DailyBriefStatus } from "@/data/daily-brief-queries";
import {
  getDailyBriefByUserAndDateRaw,
  getDailyBriefsByUserAndDateRangeRaw,
  upsertDailyBriefStatusRaw,
} from "@/data/daily-brief-queries";

export type { DailyBriefInsert, DailyBriefRow, DailyBriefStatus } from "@/data/daily-brief-queries";

export async function getDailyBriefByUserAndDate(userId: string, briefDate: string) {
  return getDailyBriefByUserAndDateRaw(userId, briefDate);
}

export async function upsertDailyBriefStatus(brief: DailyBriefInsert) {
  return upsertDailyBriefStatusRaw(brief);
}

export async function getDailyBriefsByUserAndDateRange(
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
    status?: string;
  } = {},
) {
  return getDailyBriefsByUserAndDateRangeRaw(userId, options);
}
