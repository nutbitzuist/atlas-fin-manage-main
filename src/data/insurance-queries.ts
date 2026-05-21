import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type InsurancePolicyRow = Tables<"insurance_policies">;
export type InsurancePolicyInsert = TablesInsert<"insurance_policies">;
export type InsurancePolicyUpdate = TablesUpdate<"insurance_policies">;
export type InsuranceStatus = "active" | "inactive" | "expired" | "all";

export type InsurancePolicyQueryOptions = {
  status?: InsuranceStatus;
  orderBy?: "renewal_date" | "start_date" | "updated_at";
  ascending?: boolean;
};

export async function getInsurancePoliciesByUserRaw(
  userId: string,
  options: InsurancePolicyQueryOptions = {},
) {
  let query = supabase
    .from("insurance_policies")
    .select("*")
    .eq("user_id", userId);

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.orderBy) {
    const ascending = options.ascending ?? true;
    query = query.order(options.orderBy, { ascending });
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as InsurancePolicyRow[] | null;
}

export async function getLatestInsurancePolicyByUserRaw(userId: string) {
  const { data, error } = await supabase
    .from("insurance_policies")
    .select("updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.updated_at || null;
}

export async function createInsurancePolicyRaw(policy: InsurancePolicyInsert): Promise<InsurancePolicyRow> {
  const { data, error } = await supabase
    .from("insurance_policies")
    .insert(policy)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create insurance policy");

  return data as InsurancePolicyRow;
}

export async function updateInsurancePolicyRaw(
  policyId: string,
  userId: string,
  updates: InsurancePolicyUpdate,
) {
  const { error } = await supabase
    .from("insurance_policies")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", policyId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteInsurancePolicyRaw(policyId: string, userId: string) {
  const { error } = await supabase
    .from("insurance_policies")
    .delete()
    .eq("id", policyId)
    .eq("user_id", userId);

  if (error) throw error;
}
