import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SummaryStatus = "active" | "all";
export type CashAccountRow = Tables<"cash_accounts">;
export type InvestmentRow = Tables<"investments">;
export type RealEstateRow = Tables<"real_estate">;
export type VehicleRow = Tables<"vehicles">;
export type OtherAssetRow = Tables<"other_assets">;
export type CreditCardRow = Tables<"credit_cards">;
export type LoanRow = Tables<"loans">;

type StatusFilterableQuery<T> = { eq: (column: string, value: string) => T };

const applyStatusFilter = <T extends StatusFilterableQuery<T>>(
  query: T,
  status: SummaryStatus,
  field = "status",
): T => {
  if (status === "active") {
    return query.eq(field, "active") as T;
  }

  return query;
};

export async function fetchCashAccountsForSummary(userId: string, status: SummaryStatus): Promise<CashAccountRow[]> {
  const query = applyStatusFilter(
    supabase.from("cash_accounts").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as CashAccountRow[]) || [];
}

export async function fetchInvestmentsForSummary(userId: string, status: SummaryStatus): Promise<InvestmentRow[]> {
  const query = applyStatusFilter(
    supabase.from("investments").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as InvestmentRow[]) || [];
}

export async function fetchRealEstateForSummary(userId: string, status: SummaryStatus): Promise<RealEstateRow[]> {
  const query = applyStatusFilter(
    supabase.from("real_estate").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as RealEstateRow[]) || [];
}

export async function fetchVehiclesForSummary(userId: string, status: SummaryStatus): Promise<VehicleRow[]> {
  const query = applyStatusFilter(
    supabase.from("vehicles").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as VehicleRow[]) || [];
}

export async function fetchOtherAssetsForSummary(userId: string, status: SummaryStatus): Promise<OtherAssetRow[]> {
  const query = applyStatusFilter(
    supabase.from("other_assets").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as OtherAssetRow[]) || [];
}

export async function fetchCreditCardsForSummary(userId: string, status: SummaryStatus): Promise<CreditCardRow[]> {
  const query = applyStatusFilter(
    supabase.from("credit_cards").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as CreditCardRow[]) || [];
}

export async function fetchLoansForSummary(userId: string, status: SummaryStatus): Promise<LoanRow[]> {
  const query = applyStatusFilter(
    supabase.from("loans").select("*").eq("user_id", userId),
    status,
  );

  const { data, error } = await query;
  if (error) throw error;

  return (data as LoanRow[]) || [];
}
