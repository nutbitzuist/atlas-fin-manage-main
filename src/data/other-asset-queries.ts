import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type OtherAssetRow = Tables<"other_assets">;
export type OtherAssetInsert = TablesInsert<"other_assets">;
export type OtherAssetUpdate = TablesUpdate<"other_assets">;

export async function getOtherAssetsByUserRaw(userId: string): Promise<OtherAssetRow[]> {
  const { data, error } = await supabase
    .from("other_assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as OtherAssetRow[]) || [];
}

export async function createOtherAssetRaw(asset: OtherAssetInsert): Promise<OtherAssetRow> {
  const { data, error } = await supabase
    .from("other_assets")
    .insert(asset)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create other asset");
  return data as OtherAssetRow;
}

export async function updateOtherAssetRaw(assetId: string, userId: string, updates: OtherAssetUpdate) {
  const { error } = await supabase
    .from("other_assets")
    .update(updates)
    .eq("id", assetId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteOtherAssetByIdRaw(userId: string, assetId: string) {
  const { error } = await supabase
    .from("other_assets")
    .delete()
    .eq("id", assetId)
    .eq("user_id", userId);

  if (error) throw error;
}
