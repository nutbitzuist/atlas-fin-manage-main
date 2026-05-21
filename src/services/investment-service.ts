import type { InvestmentInsert, InvestmentQueryOptions, InvestmentRow, InvestmentUpdate } from "@/data/investment-queries";
import {
  createInvestmentRaw,
  deleteInvestmentByIdRaw,
  getInvestmentsByUserRaw,
  updateInvestmentRaw,
} from "@/data/investment-queries";

export type { InvestmentInsert, InvestmentQueryOptions, InvestmentRow, InvestmentUpdate } from "@/data/investment-queries";

export async function getInvestmentsByUser(
  userId: string,
  options: InvestmentQueryOptions = {},
) {
  return getInvestmentsByUserRaw(userId, options);
}

export async function deleteInvestmentById(userId: string, investmentId: string) {
  await deleteInvestmentByIdRaw(userId, investmentId);
}

export async function createInvestment(investment: InvestmentInsert): Promise<InvestmentRow> {
  return createInvestmentRaw(investment);
}

export async function updateInvestment(investmentId: string, userId: string, updates: InvestmentUpdate) {
  await updateInvestmentRaw(investmentId, userId, updates);
}
