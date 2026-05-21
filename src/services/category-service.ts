import type { CategoryInsert, CategoryQueryOptions, CategoryRow, CategoryType, CategoryUpdate } from "@/data/category-queries";
import {
  createCategoryRaw,
  deleteCategoryRaw,
  getCategoriesByUserRaw,
  getCategoryByIdRaw,
  getCategoryNamesByUserAndTypeRaw,
  updateCategoryRaw,
} from "@/data/category-queries";

export type { CategoryInsert, CategoryQueryOptions, CategoryRow, CategoryType, CategoryUpdate } from "@/data/category-queries";

export async function getCategoriesByUser(
  userId: string,
  options: CategoryQueryOptions = {},
): Promise<CategoryRow[] | null> {
  return getCategoriesByUserRaw(userId, options);
}

export async function getCategoryNamesByUserAndType(
  userId: string,
  type: CategoryType,
): Promise<string[]> {
  return getCategoryNamesByUserAndTypeRaw(userId, type);
}

export async function getCategoryById(
  categoryId: string,
  userId: string,
): Promise<CategoryRow | null> {
  return getCategoryByIdRaw(categoryId, userId);
}

export async function createCategory(category: CategoryInsert): Promise<CategoryRow> {
  return createCategoryRaw(category);
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  updates: CategoryUpdate,
) {
  await updateCategoryRaw(categoryId, userId, updates);
}

export async function deleteCategory(categoryId: string, userId: string) {
  await deleteCategoryRaw(categoryId, userId);
}
