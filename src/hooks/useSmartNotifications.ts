import { useEffect, useRef } from "react";
import { startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { createNotification, getNotificationsByDedupeKeys } from "@/services/notification-service";
import { buildCashFlowForecast, formatTHB } from "@/utils/planning";
import { toLocalDateInput } from "@/utils/date";
import { getCashAccountBalancesByUser } from "@/services/cash-account-service";
import { getBudgetsByUserAndMonth } from "@/services/budget-service";
import { getIncomeByUserId } from "@/services/income-service";
import { getSavingsGoalsByUserId } from "@/services/savings-goal-service";
import { getMonthlyUpdateByUserAndMonth } from "@/services/monthly-update-service";
import { getDailyBriefByUserAndDate } from "@/services/daily-brief-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getBillsByUserId } from "@/services/bill-service";

type NotificationInput = {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "bill" | "budget" | "goal" | "insurance";
  link: string;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
};

const getDedupeKey = (metadata: Json | null): string | null => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const value = metadata.dedupe_key;
    return typeof value === "string" ? value : null;
  }
  return null;
};

export const useSmartNotifications = () => {
  const processedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const today = toLocalDateInput(now);
        const monthStart = toLocalDateInput(startOfMonth(now));
        const monthEnd = toLocalDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        const nextSevenDays = toLocalDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));

        const [
          cashResult,
          budgetsResult,
          goalsResult,
          incomeResult,
          monthlyUpdateResult,
          dailyBriefResult,
          transactions,
        ] = await Promise.all([
          getCashAccountBalancesByUser(user.id),
          getBudgetsByUserAndMonth(user.id, { month: monthStart }),
          getSavingsGoalsByUserId(user.id),
          getIncomeByUserId(user.id),
          getMonthlyUpdateByUserAndMonth(user.id, monthStart),
          getDailyBriefByUserAndDate(user.id, today),
          getTransactionsByUserId(user.id, {}, "amount, category, description, merchant, transaction_date, type"),
        ]);
        const billsResult = await getBillsByUserId(user.id);

        if (!cashResult || !budgetsResult || !goalsResult || !incomeResult) {
          return;
        }

        const notifications: NotificationInput[] = [];
        const cashBalance = cashResult.reduce((sum, account) => sum + Number(account.balance || 0), 0);

        const monthTransactions = transactions.filter(
          (transaction) => transaction.transaction_date >= monthStart && transaction.transaction_date <= monthEnd
        );
        const monthlyExpenses = monthTransactions
          .filter((transaction) => transaction.type === "expense")
          .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

        const forecast = buildCashFlowForecast({
          cashBalance,
          incomeSources: incomeResult,
          bills: billsResult || [],
          transactions,
          days: 90,
        });

        if (forecast.lowCashRisk) {
          notifications.push({
            title: "Cash forecast needs attention",
            message: `Your 90-day projected cash is ${formatTHB(forecast.projectedCash)}.`,
            type: "warning",
            link: "/cash-flow",
            dedupeKey: `cash-forecast-${today}`,
            metadata: { projected_cash: forecast.projectedCash },
          });
        }

        const upcomingBills = (billsResult || []).filter(
          (bill) => !bill.is_paid && bill.due_date >= today && bill.due_date <= nextSevenDays
        );

        upcomingBills.forEach((bill) => {
          notifications.push({
            title: "Bill due soon",
            message: `${bill.name} is due on ${new Date(bill.due_date).toLocaleDateString()} for ${formatTHB(Number(bill.amount || 0))}.`,
            type: "bill",
            link: "/bills",
            dedupeKey: `bill-${bill.id}-${bill.due_date}`,
            metadata: { bill_id: bill.id, amount: bill.amount, due_date: bill.due_date },
          });
        });

        (budgetsResult || []).forEach((budget) => {
          const spent = monthTransactions
            .filter((transaction) => transaction.type === "expense" && transaction.category === budget.category)
            .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
          const usage = Number(budget.monthly_limit || 0) > 0 ? (spent / Number(budget.monthly_limit || 0)) * 100 : 0;

          if (usage >= 80) {
            notifications.push({
              title: usage >= 100 ? "Budget exceeded" : "Budget almost used",
              message: `${budget.category} is at ${usage.toFixed(0)}% of its monthly budget.`,
              type: "budget",
              link: "/budget",
              dedupeKey: `budget-${budget.id}-${monthStart}-${usage >= 100 ? "100" : "80"}`,
              metadata: { budget_id: budget.id, category: budget.category, usage, spent, limit: budget.monthly_limit },
            });
          }
        });

        (goalsResult || []).forEach((goal) => {
          const target = Number(goal.target_amount || 0);
          const current = Number(goal.current_amount || 0);
          if (!target || !goal.target_date) return;

          const progress = (current / target) * 100;
          const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysLeft <= 90 && progress < 75 && progress < 100) {
            notifications.push({
              title: "Goal needs momentum",
              message: `${goal.name} is ${progress.toFixed(0)}% funded with ${Math.max(0, daysLeft)} days left.`,
              type: "goal",
              link: "/savings-goals",
              dedupeKey: `goal-behind-${goal.id}-${today}`,
              metadata: { goal_id: goal.id, progress, target_date: goal.target_date },
            });
          }
        });

        if (!dailyBriefResult || dailyBriefResult.status !== "completed") {
          notifications.push({
            title: "Daily brief is ready",
            message: "Review today's bills, cash risks, budget pace, and next action.",
            type: "info",
            link: "/daily-brief",
            dedupeKey: `daily-brief-${today}`,
          });
        }

        if (now.getDate() >= 24 && (!monthlyUpdateResult || monthlyUpdateResult.status !== "completed")) {
          notifications.push({
            title: "Monthly review is due",
            message: "Close out this month by updating balances, bills, budgets, and your net worth snapshot.",
            type: "info",
            link: "/monthly-update",
            dedupeKey: `monthly-update-${monthStart}`,
          });
        }

        if (monthlyExpenses === 0 && transactions.length > 0) {
          notifications.push({
            title: "Expenses look incomplete",
            message: "No expense transactions are recorded for this month yet.",
            type: "warning",
            link: "/expenses",
            dedupeKey: `expenses-empty-${monthStart}`,
          });
        }

        if (notifications.length === 0) return;

        const dedupeKeys = notifications.map((notification) => notification.dedupeKey);
        const existing = await getNotificationsByDedupeKeys(user.id, dedupeKeys);

        const existingKeys = new Set((existing || []).map((notification) => getDedupeKey(notification.metadata)).filter(Boolean));
        const rows = notifications
          .filter((notification) => !existingKeys.has(notification.dedupeKey))
          .map((notification) => ({
            user_id: user.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            metadata: {
              ...notification.metadata,
              dedupe_key: notification.dedupeKey,
              generated_by: "smart_notifications",
            },
          }));

        if (rows.length > 0) {
          await Promise.all(
            rows.map((row) =>
              createNotification({
                user_id: user.id,
                title: row.title,
                message: row.message,
                type: row.type,
                link: row.link,
                metadata: row.metadata,
              })
            )
          );
        }
      } catch (error) {
        console.error("Error building smart notifications:", error);
        return;
      }
    };

    const timeout = window.setTimeout(run, 3000);
    return () => window.clearTimeout(timeout);
  }, []);
};
