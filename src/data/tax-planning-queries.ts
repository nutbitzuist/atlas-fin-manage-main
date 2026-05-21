import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type TaxPlanningRow = Tables<"tax_planning">;
export type TaxPlanningInsert = TablesInsert<"tax_planning">;

export async function getTaxPlanningByUserAndYearRaw(userId: string, taxYear: number) {
  const { data, error } = await supabase
    .from("tax_planning")
    .select("*")
    .eq("user_id", userId)
    .eq("tax_year", taxYear)
    .maybeSingle();

  if (error) throw error;
  return data as TaxPlanningRow | null;
}

export async function upsertTaxPlanningRaw(data: TaxPlanningInsert) {
  const { data: saved, error } = await supabase
    .from("tax_planning")
    .upsert(data, {
      onConflict: "user_id,tax_year",
    })
    .select()
    .single();

  if (error) throw error;
  if (!saved) throw new Error("Failed to save tax planning data");

  return saved as TaxPlanningRow;
}
