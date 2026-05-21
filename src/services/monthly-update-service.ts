import type {
  MonthlyUpdatePayload,
  MonthlyUpdateRow,
  MonthlyUpdateInsert,
  MonthlyUpdateUpdate,
} from "@/data/monthly-update-queries";
import {
  getMonthlyUpdateByUserAndMonthRaw,
  getMonthlyUpdatesByUserRaw,
  upsertMonthlyUpdateRaw,
} from "@/data/monthly-update-queries";

export type {
  MonthlyUpdatePayload,
  MonthlyUpdateRow,
  MonthlyUpdateInsert,
  MonthlyUpdateUpdate,
} from "@/data/monthly-update-queries";

export async function getMonthlyUpdateByUserAndMonth(
  userId: string,
  month: string,
): Promise<MonthlyUpdateRow | null> {
  return getMonthlyUpdateByUserAndMonthRaw(userId, month);
}

export async function getMonthlyUpdatesByUser(
  userId: string,
  options: {
    status?: string;
    startDate?: string;
    order?: {
      ascending?: boolean;
      limit?: number;
    };
  } = {},
) {
  return getMonthlyUpdatesByUserRaw(userId, options);
}

export async function upsertMonthlyUpdate(update: MonthlyUpdatePayload): Promise<MonthlyUpdateRow | null> {
  return upsertMonthlyUpdateRaw(update);
}
