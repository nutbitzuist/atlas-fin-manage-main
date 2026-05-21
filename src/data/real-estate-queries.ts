import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type RealEstateRow = Tables<"real_estate">;
export type RealEstateInsert = TablesInsert<"real_estate">;
export type RealEstateUpdate = TablesUpdate<"real_estate">;

export async function getRealEstateByUserRaw(userId: string): Promise<RealEstateRow[]> {
  const { data, error } = await supabase
    .from("real_estate")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as RealEstateRow[]) || [];
}

export async function createRealEstateRaw(property: RealEstateInsert): Promise<RealEstateRow> {
  const { data, error } = await supabase
    .from("real_estate")
    .insert(property)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create real estate");
  return data as RealEstateRow;
}

export async function updateRealEstateRaw(propertyId: string, userId: string, updates: RealEstateUpdate) {
  const { error } = await supabase
    .from("real_estate")
    .update(updates)
    .eq("id", propertyId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteRealEstateByIdRaw(userId: string, propertyId: string) {
  const { error } = await supabase
    .from("real_estate")
    .delete()
    .eq("id", propertyId)
    .eq("user_id", userId);

  if (error) throw error;
}
