import type { WeeklyReviewInsert, WeeklyReviewRow } from "@/data/weekly-review-queries";
import {
  getWeeklyReviewByUserAndWeekStartRaw,
  getWeeklyReviewsByUserRaw,
  upsertWeeklyReviewRaw,
} from "@/data/weekly-review-queries";

export type { WeeklyReviewInsert, WeeklyReviewRow } from "@/data/weekly-review-queries";

export async function getWeeklyReviewsByUser(
  userId: string,
  options: {
    status?: string;
    startDate?: string;
    orderBy?: "week_start";
    ascending?: boolean;
  } = {},
) {
  return getWeeklyReviewsByUserRaw(userId, options);
}

export async function getWeeklyReviewByUserAndWeekStart(
  userId: string,
  weekStart: string,
) {
  return getWeeklyReviewByUserAndWeekStartRaw(userId, weekStart);
}

export async function upsertWeeklyReview(payload: WeeklyReviewInsert) {
  return upsertWeeklyReviewRaw(payload);
}
