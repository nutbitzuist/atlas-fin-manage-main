import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type VehicleRow = Tables<"vehicles">;
export type VehicleInsert = TablesInsert<"vehicles">;
export type VehicleUpdate = TablesUpdate<"vehicles">;

export async function getVehiclesByUserRaw(userId: string): Promise<VehicleRow[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as VehicleRow[]) || [];
}

export async function createVehicleRaw(vehicle: VehicleInsert): Promise<VehicleRow> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert(vehicle)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create vehicle");
  return data as VehicleRow;
}

export async function updateVehicleRaw(vehicleId: string, userId: string, updates: VehicleUpdate) {
  const { error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", vehicleId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteVehicleByIdRaw(userId: string, vehicleId: string) {
  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("user_id", userId);

  if (error) throw error;
}
