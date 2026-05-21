import type { IncomeInsert, IncomeQueryOptions, IncomeRow, IncomeUpdate } from "@/data/income-queries";
import {
  createIncomeRaw,
  deleteIncomeRaw,
  getActiveIncomeSourcesRaw,
  getIncomeByUserIdRaw,
  updateIncomeRaw,
} from "@/data/income-queries";

export type { IncomeInsert, IncomeQueryOptions, IncomeRow, IncomeUpdate } from "@/data/income-queries";

export async function getIncomeByUserId(
  userId: string,
  options: IncomeQueryOptions = {},
): Promise<IncomeRow[] | null> {
  return getIncomeByUserIdRaw(userId, options);
}

export async function getActiveIncomeSources(userId: string) {
  return getActiveIncomeSourcesRaw(userId);
}

export async function createIncome(data: IncomeInsert): Promise<IncomeRow> {
  return createIncomeRaw(data);
}

export async function updateIncome(
  incomeId: string,
  userId: string,
  updates: IncomeUpdate,
) {
  await updateIncomeRaw(incomeId, userId, updates);
}

export async function deleteIncome(incomeId: string, userId: string) {
  await deleteIncomeRaw(incomeId, userId);
}
