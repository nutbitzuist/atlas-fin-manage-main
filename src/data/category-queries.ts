import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type CategoryRow = Tables<"categories">;
export type CategoryInsert = TablesInsert<"categories">;
export type CategoryUpdate = TablesUpdate<"categories">;

export type CategoryType = "income" | "expense";

export type CategoryQueryOptions = {
  type?: CategoryType;
  orderBy?: "name" | "type" | "created_at" | "updated_at";
  ascending?: boolean;
};

export async function getCategoriesByUserRaw(
  userId: string,
  options: CategoryQueryOptions = {},
): Promise<CategoryRow[] | null> {
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId);

  if (options.type) {
    query = query.eq("type", options.type);
  }

  if (options.orderBy) {
    const ascending = options.ascending ?? true;
    query = query.order(options.orderBy, { ascending });
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as CategoryRow[] | null;
}

export async function getCategoryNamesByUserAndTypeRaw(
  userId: string,
  type: CategoryType,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", userId)
    .eq("type", type)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map((cat) => cat.name);
}

export async function getCategoryByIdRaw(
  categoryId: string,
  userId: string,
): Promise<CategoryRow | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as CategoryRow | null;
}

export async function createCategoryRaw(category: CategoryInsert): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create category");

  return data as CategoryRow;
}

export async function updateCategoryRaw(
  categoryId: string,
  userId: string,
  updates: CategoryUpdate,
) {
  const { error } = await supabase
    .from("categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteCategoryRaw(categoryId: string, userId: string) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  if (error) throw error;
}
