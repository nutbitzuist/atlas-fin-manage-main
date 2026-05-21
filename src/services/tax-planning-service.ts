import type { TaxPlanningInsert, TaxPlanningRow } from "@/data/tax-planning-queries";
import { getTaxPlanningByUserAndYearRaw, upsertTaxPlanningRaw } from "@/data/tax-planning-queries";

export type { TaxPlanningInsert, TaxPlanningRow } from "@/data/tax-planning-queries";

export async function getTaxPlanningByUserAndYear(userId: string, taxYear: number) {
  return getTaxPlanningByUserAndYearRaw(userId, taxYear);
}

export async function upsertTaxPlanning(data: TaxPlanningInsert) {
  return upsertTaxPlanningRaw(data);
}
