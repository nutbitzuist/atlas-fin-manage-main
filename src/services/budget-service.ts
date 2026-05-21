import { logAuditEvent } from "@/services/audit-service";
import type { BudgetMonth, BudgetQueryOptions, BudgetRow, BudgetInsert, BudgetUpdate } from "@/data/budget-queries";
import {
  createBudgetCategoriesRaw,
  createBudgetCategoryRaw,
  deleteBudgetByIdRaw,
  deleteBudgetsByMonthRaw,
  getBudgetsByUserAndMonthRaw,
  getUserExpenseCategoriesRaw,
  updateBudgetRaw,
} from "@/data/budget-queries";

export type { BudgetMonth, BudgetQueryOptions, BudgetRow, BudgetInsert, BudgetUpdate } from "@/data/budget-queries";

export async function getBudgetsByUserAndMonth(
  userId: string,
  options: BudgetQueryOptions = {},
): Promise<BudgetRow[] | null> {
  return getBudgetsByUserAndMonthRaw(userId, options);
}

export async function getUserExpenseCategories(userId: string) {
  return getUserExpenseCategoriesRaw(userId);
}

export async function createBudgetCategory(budget: BudgetInsert): Promise<BudgetRow> {
  const created = await createBudgetCategoryRaw(budget);

  void logAuditEvent({
    user_id: budget.user_id,
    event_type: "budget_created",
    entity_type: "budgets",
    entity_id: created.id,
    metadata: {
      category: budget.category,
      month: budget.month,
      currency: budget.currency,
      source: "single_insert",
    },
  });

  return created;
}

export async function createBudgetCategories(userId: string, budgets: BudgetInsert[]): Promise<BudgetRow[]> {
  const created = await createBudgetCategoriesRaw(userId, budgets);

  void logAuditEvent({
    user_id: userId,
    event_type: "budget_created",
    entity_type: "budgets",
    metadata: {
      count: budgets.length,
      source: "bulk_insert",
    },
  });

  return created;
}

export async function updateBudget(
  budgetId: string,
  userId: string,
  updates: BudgetUpdate,
) {
  await updateBudgetRaw(budgetId, userId, updates);

  void logAuditEvent({
    user_id: userId,
    event_type: "budget_updated",
    entity_type: "budgets",
    entity_id: budgetId,
    metadata: updates,
  });
}

export async function deleteBudgetById(budgetId: string, userId: string) {
  await deleteBudgetByIdRaw(budgetId, userId);

  void logAuditEvent({
    user_id: userId,
    event_type: "budget_deleted",
    entity_type: "budgets",
    entity_id: budgetId,
  });
}

export async function deleteBudgetsByMonth(userId: string, month: BudgetMonth) {
  await deleteBudgetsByMonthRaw(userId, month);

  void logAuditEvent({
    user_id: userId,
    event_type: "budgets_reset",
    entity_type: "budgets",
    metadata: { month },
  });
}
