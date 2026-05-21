import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type CreditCardRow = Tables<"credit_cards">;
export type CreditCardInsert = TablesInsert<"credit_cards">;
export type CreditCardUpdate = TablesUpdate<"credit_cards">;

export async function getCreditCardsByUserRaw(userId: string): Promise<CreditCardRow[]> {
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as CreditCardRow[]) || [];
}

export async function createCreditCardRaw(card: CreditCardInsert): Promise<CreditCardRow> {
  const { data, error } = await supabase
    .from("credit_cards")
    .insert(card)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create credit card");
  return data as CreditCardRow;
}

export async function updateCreditCardRaw(cardId: string, userId: string, updates: CreditCardUpdate) {
  const { error } = await supabase
    .from("credit_cards")
    .update(updates)
    .eq("id", cardId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteCreditCardByIdRaw(userId: string, cardId: string) {
  const { error } = await supabase
    .from("credit_cards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", userId);

  if (error) throw error;
}
