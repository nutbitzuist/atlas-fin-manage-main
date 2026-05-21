import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type AssetRow = Tables<"assets">;
export type AssetInsert = TablesInsert<"assets">;

export async function createAssetRaw(asset: AssetInsert): Promise<AssetRow> {
  const { data, error } = await supabase
    .from("assets")
    .insert(asset)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create asset");

  return data as AssetRow;
}
