import { logAuditEvent } from "@/services/audit-service";
import { createTransaction, type TransactionRow } from "@/services/transaction-service";
import type {
  SavingsGoalContributionCategory,
  SavingsGoalInsert,
  SavingsGoalRow,
  SavingsGoalUpdate,
} from "@/data/savings-goal-queries";
import {
  createSavingsGoalRaw,
  deleteSavingsGoalRaw,
  getDefaultSavingsGoalRaw,
  getSavingsGoalByIdRaw,
  getSavingsGoalsByUserIdRaw,
  updateSavingsGoalRaw,
} from "@/data/savings-goal-queries";
import type { Json } from "@/integrations/supabase/types";

const toIsoDate = (date: string | Date = new Date()) => {
  if (date instanceof Date) return date.toISOString().split("T")[0];
  return date;
};

export type {
  SavingsGoalContributionCategory,
  SavingsGoalInsert,
  SavingsGoalRow,
  SavingsGoalUpdate,
} from "@/data/savings-goal-queries";

export async function getSavingsGoalsByUserId(userId: string) {
  return getSavingsGoalsByUserIdRaw(userId);
}

export async function getSavingsGoalById(userId: string, goalId: string) {
  return getSavingsGoalByIdRaw(userId, goalId);
}

export async function getDefaultSavingsGoal(userId: string) {
  return getDefaultSavingsGoalRaw(userId);
}

export async function createSavingsGoal(userId: string, goal: Omit<SavingsGoalInsert, "user_id">) {
  const created = await createSavingsGoalRaw(userId, goal);

  void logAuditEvent({
    user_id: userId,
    event_type: "savings_goal_created",
    entity_type: "savings_goals",
    entity_id: (created as SavingsGoalRow).id,
    metadata: {
      amount: goal.target_amount,
      name: goal.name,
      category: goal.category ?? null,
    },
  });

  return created as SavingsGoalRow;
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  updates: SavingsGoalUpdate,
) {
  await updateSavingsGoalRaw(userId, goalId, updates);
}

export async function deleteSavingsGoal(userId: string, goalId: string) {
  await deleteSavingsGoalRaw(userId, goalId);

  void logAuditEvent({
    user_id: userId,
    event_type: "savings_goal_deleted",
    entity_type: "savings_goals",
    entity_id: goalId,
  });
}

export async function upsertDefaultSavingsGoal(
  userId: string,
  targetAmount: number,
  currentAmount: number,
  target: {
    name?: string;
    category?: string | null;
    currency?: string | null;
  } = {},
) {
  const existing = await getDefaultSavingsGoal(userId);

  if (existing) {
    await updateSavingsGoal(userId, existing.id, {
      target_amount: targetAmount,
      current_amount: currentAmount,
    });
    return;
  }

  await createSavingsGoal(userId, {
    name: target.name || "Emergency Fund",
    target_amount: targetAmount,
    current_amount: currentAmount,
    category: target.category || "Emergency",
    currency: target.currency || "THB",
    is_default: true,
  });
}

export async function addSavingsGoalContribution(
  userId: string,
  goal: Pick<SavingsGoalRow, "id" | "name" | "current_amount" | "currency" | "category">,
  amount: number,
  contributionDate: string | Date = new Date(),
) {
  if (!(amount > 0)) throw new Error("Contribution amount must be greater than zero");

  const metadata: Json = {
    goal_id: goal.id,
    goal_name: goal.name,
    contribution_amount: amount,
  };

  const contributionCategory: SavingsGoalContributionCategory =
    goal.category === "Retirement" || goal.category === "Investment"
      ? "Investment"
      : "Savings";

  const newCurrentAmount = goal.current_amount + amount;
  await updateSavingsGoal(userId, goal.id, { current_amount: newCurrentAmount });

  const transaction = await createTransaction({
    user_id: userId,
    amount,
    currency: goal.currency || "THB",
    description: `Contribution to ${goal.name}`,
    category: contributionCategory,
    type: "transfer",
    transaction_date: toIsoDate(contributionDate),
  }) as TransactionRow;

  void logAuditEvent({
    user_id: userId,
    event_type: "savings_goal_contribution",
    entity_type: "savings_goals",
    entity_id: goal.id,
    metadata,
  });

  return {
    goal: { ...goal, current_amount: newCurrentAmount } as SavingsGoalRow,
    transaction,
  };
}
