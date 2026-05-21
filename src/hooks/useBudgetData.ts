import { useCallback, useState } from "react";
import {
  createBudgetCategories,
  createBudgetCategory,
  deleteBudgetById,
  deleteBudgetsByMonth,
  getBudgetsByUserAndMonth,
  getUserExpenseCategories,
  updateBudget,
  type BudgetInsert,
} from "@/services/budget-service";
import { getTransactionsByUserId } from "@/services/transaction-service";

interface ToastPayload {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgeted: number;
  spent: number;
  currency: string;
  month: string;
  description?: string;
}

export interface SmartBudgetSuggestion {
  category: string;
  averageSpent: number;
  suggestedLimit: number;
  currentLimit: number;
  change: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

type ToastFn = (payload: ToastPayload) => void;

type CreateBudgetPayload = {
  category: string;
  monthlyLimit: number;
  description: string;
};

const toDateString = (date: Date) => date.toISOString().split("T")[0];

export const useBudgetData = (currentMonth: Date, toast: ToastFn) => {
  const [loading, setLoading] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [userCategories, setUserCategories] = useState<ExpenseCategory[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartBudgetSuggestion[]>([]);
  const [smartBudgetLoading, setSmartBudgetLoading] = useState(false);
  const [lastMonthSpent, setLastMonthSpent] = useState<number | null>(null);

  const fetchBudgetsAndTransactions = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);

        const monthStr = toDateString(currentMonth);
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const firstDayOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

        const [categoriesData, budgetsData, transactionsData, lastMonthTx] = await Promise.all([
          getUserExpenseCategories(userId),
          getBudgetsByUserAndMonth(userId, { month: monthStr }),
          getTransactionsByUserId(
            userId,
            {
              type: "expense",
              startDate: toDateString(firstDayOfMonth),
              endDate: toDateString(lastDayOfMonth),
            },
            "category, amount, type"
          ),
          getTransactionsByUserId(
            userId,
            {
              type: "expense",
              startDate: toDateString(firstDayOfLastMonth),
              endDate: toDateString(lastDayOfLastMonth),
            },
            "amount"
          ),
        ]);

        if (categoriesData) {
          setUserCategories(
            categoriesData.map((category) => ({
              id: category.id,
              name: category.name,
              icon: category.icon || "💰",
              color: category.color || "#3b82f6",
              type: category.type,
            }))
          );
        } else {
          setUserCategories([]);
        }

        const spendingByCategory: Record<string, number> = {};
        (transactionsData || []).forEach((transaction) => {
          const category = transaction.category || "Other";
          spendingByCategory[category] = (spendingByCategory[category] || 0) + Number(transaction.amount || 0);
        });

        const categoryLookup: Record<string, { icon: string; color: string }> = {};
        (categoriesData || []).forEach((category) => {
          categoryLookup[category.name] = {
            icon: category.icon || "💰",
            color: category.color || "#3b82f6",
          };
        });

        const categories: BudgetCategory[] = (budgetsData || []).map((budget) => {
          const categoryName = budget.category;
          const catInfo = categoryLookup[categoryName] || { icon: "💰", color: "#3b82f6" };

          return {
            id: budget.id,
            name: categoryName,
            icon: catInfo.icon,
            color: catInfo.color,
            budgeted: Number(budget.monthly_limit),
            spent: spendingByCategory[categoryName] || 0,
            currency: budget.currency || "THB",
            month: budget.month,
            description: budget.description,
          };
        });

        if (lastMonthTx) {
          const total = lastMonthTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
          setLastMonthSpent(total);
        } else {
          setLastMonthSpent(null);
        }

        setBudgetCategories(categories);
      } catch (error) {
        console.error("Error in fetchBudgetsAndTransactions:", error);
        toast({
          title: "Error",
          description: "Failed to load budget data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [currentMonth, toast]
  );

  const updateBudgetAmount = useCallback(
    async (userId: string, id: string, newAmount: number) => {
      try {
        await updateBudget(id, userId, { monthly_limit: newAmount });

        setBudgetCategories((prev) =>
          prev.map((cat) => (cat.id === id ? { ...cat, budgeted: newAmount } : cat))
        );

        toast({
          title: "Success",
          description: "Budget updated successfully",
        });
      } catch (error) {
        console.error("Error updating budget:", error);
        toast({
          title: "Error",
          description: "Failed to update budget",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const buildBudgetInsert = useCallback(
    (userId: string, payload: CreateBudgetPayload): BudgetInsert => ({
      user_id: userId,
      category: payload.category,
      monthly_limit: payload.monthlyLimit,
      month: toDateString(currentMonth),
      currency: "THB",
      description: payload.description || null,
    }),
    [currentMonth]
  );

  const createBudget = useCallback(
    async (userId: string, payload: CreateBudgetPayload) => {
      try {
        await createBudgetCategory(buildBudgetInsert(userId, payload));
        await fetchBudgetsAndTransactions(userId);

        toast({
          title: "Success",
          description: "Budget created successfully",
        });
      } catch (error) {
        console.error("Error creating budget:", error);
        toast({
          title: "Error",
          description: "Failed to create budget",
          variant: "destructive",
        });
      }
    },
    [buildBudgetInsert, fetchBudgetsAndTransactions, toast]
  );

  const deleteBudget = useCallback(
    async (userId: string, id: string) => {
      try {
        await deleteBudgetById(id, userId);
        setBudgetCategories((prev) => prev.filter((cat) => cat.id !== id));

        toast({
          title: "Success",
          description: "Budget deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting budget:", error);
        toast({
          title: "Error",
          description: "Failed to delete budget",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const copyFromLastMonth = useCallback(
    async (userId: string) => {
      try {
        const month = currentMonth;
        const lastMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
        const lastMonthStr = toDateString(lastMonth);
        const monthStr = toDateString(month);

        const lastMonthBudgets = await getBudgetsByUserAndMonth(userId, { month: lastMonthStr });

        if (!lastMonthBudgets || lastMonthBudgets.length === 0) {
          toast({
            title: "No budgets found",
            description: "No budgets found from last month to copy",
          });
          return;
        }

        const budgetsToInsert: BudgetInsert[] = lastMonthBudgets.map((budget) => ({
          user_id: userId,
          category: budget.category,
          monthly_limit: budget.monthly_limit,
          month: monthStr,
          currency: budget.currency || "THB",
          description: budget.description,
        }));

        await createBudgetCategories(userId, budgetsToInsert);
        await fetchBudgetsAndTransactions(userId);

        toast({
          title: "Success",
          description: `Copied ${lastMonthBudgets.length} budgets from last month`,
        });
      } catch (error) {
        console.error("Error copying budgets:", error);
        toast({
          title: "Error",
          description: "Failed to copy budgets from last month",
          variant: "destructive",
        });
      }
    },
    [currentMonth, fetchBudgetsAndTransactions, toast]
  );

  const resetBudget = useCallback(
    async (userId: string) => {
      try {
        const monthStr = toDateString(currentMonth);
        await deleteBudgetsByMonth(userId, monthStr);

        setBudgetCategories([]);
        setSmartSuggestions([]);
        setLastMonthSpent(null);

        toast({
          title: "Success",
          description: "Budget reset successfully",
        });
      } catch (error) {
        console.error("Error resetting budget:", error);
        toast({
          title: "Error",
          description: "Failed to reset budget",
          variant: "destructive",
        });
      }
    },
    [currentMonth, toast]
  );

  const generateSmartBudget = useCallback(
    async (userId: string) => {
      setSmartBudgetLoading(true);

      try {
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 3, 1);

        const data = await getTransactionsByUserId(
          userId,
          {
            type: "expense",
            startDate: toDateString(startDate),
            endDate: toDateString(endDate),
          },
          "category, amount"
        );

        const spendingByCategory: Record<string, number> = {};
        (data || []).forEach((transaction) => {
          const category = transaction.category || "Other";
          spendingByCategory[category] = (spendingByCategory[category] || 0) + Number(transaction.amount || 0);
        });

        const existingLimitByCategory = budgetCategories.reduce<Record<string, number>>((acc, budget) => {
          acc[budget.name] = budget.budgeted;
          return acc;
        }, {});

        const categoryNames = new Set<string>([
          ...Object.keys(spendingByCategory),
          ...userCategories.map((category) => category.name),
          ...budgetCategories.map((budget) => budget.name),
        ]);

        const suggestions = Array.from(categoryNames)
          .map((category) => {
            const averageSpent = (spendingByCategory[category] || 0) / 3;
            const currentLimit = existingLimitByCategory[category] || 0;
            const suggestedLimit = averageSpent > 0
              ? Math.ceil((averageSpent * 1.1) / 100) * 100
              : currentLimit;

            return {
              category,
              averageSpent,
              suggestedLimit,
              currentLimit,
              change: suggestedLimit - currentLimit,
            };
          })
          .filter((suggestion) => suggestion.suggestedLimit > 0)
          .sort((a, b) => b.suggestedLimit - a.suggestedLimit);

        setSmartSuggestions(suggestions);

        toast({
          title: "Smart budget generated",
          description: `Created ${suggestions.length} category suggestion${suggestions.length === 1 ? "" : "s"} from recent spending.`,
        });
      } catch (error) {
        console.error("Error generating smart budget:", error);
        toast({
          title: "Error",
          description: "Failed to generate smart budget",
          variant: "destructive",
        });
      } finally {
        setSmartBudgetLoading(false);
      }
    },
    [currentMonth, budgetCategories, toast, userCategories]
  );

  const applySmartBudget = useCallback(
    async (userId: string) => {
      try {
        if (smartSuggestions.length === 0) return;

        setSmartBudgetLoading(true);
        const monthStr = toDateString(currentMonth);
        const existingByCategory = budgetCategories.reduce<Record<string, BudgetCategory>>((acc, budget) => {
          acc[budget.name] = budget;
          return acc;
        }, {});

        const updates = smartSuggestions.filter((suggestion) => existingByCategory[suggestion.category]);
        const inserts = smartSuggestions.filter((suggestion) => !existingByCategory[suggestion.category]);

        await Promise.all(
          updates.map((suggestion) =>
            updateBudget(existingByCategory[suggestion.category].id, userId, {
              monthly_limit: suggestion.suggestedLimit,
            })
          )
        );

        if (inserts.length > 0) {
          const budgetsToInsert: BudgetInsert[] = inserts.map((suggestion) => ({
            user_id: userId,
            category: suggestion.category,
            monthly_limit: suggestion.suggestedLimit,
            month: monthStr,
            currency: "THB",
            description: "Generated by Smart Budget Builder",
          }));
          await createBudgetCategories(userId, budgetsToInsert);
        }

        await fetchBudgetsAndTransactions(userId);

        toast({
          title: "Smart budget applied",
          description: "Your monthly budget has been updated from the generated plan.",
        });
      } catch (error) {
        console.error("Error applying smart budget:", error);
        toast({
          title: "Error",
          description: "Failed to apply smart budget",
          variant: "destructive",
        });
      } finally {
        setSmartBudgetLoading(false);
      }
    },
    [currentMonth, budgetCategories, fetchBudgetsAndTransactions, smartSuggestions, toast]
  );

  const initializeFromCategories = useCallback(
    async (userId: string) => {
      if (userCategories.length === 0) {
        toast({
          title: "No Categories Found",
          description: "Please create expense categories in Settings → Categories first.",
          variant: "destructive",
        });
        return;
      }

      try {
        const monthStr = toDateString(currentMonth);
        const existingCategoryNames = budgetCategories.map((category) => category.name);
        const categoriesToAdd = userCategories.filter((category) => !existingCategoryNames.includes(category.name));

        if (categoriesToAdd.length === 0) {
          toast({
            title: "All Categories Already Added",
            description: "All your expense categories already have budgets for this month.",
          });
          return;
        }

        const budgetsToInsert: BudgetInsert[] = categoriesToAdd.map((category) => ({
          user_id: userId,
          category: category.name,
          monthly_limit: 0,
          month: monthStr,
          currency: "THB",
          description: null,
        }));

        await createBudgetCategories(userId, budgetsToInsert);
        await fetchBudgetsAndTransactions(userId);

        toast({
          title: "Success",
          description: `Added ${categoriesToAdd.length} categories to your budget. Set the amounts below.`,
        });
      } catch (error) {
        console.error("Error initializing budgets:", error);
        toast({
          title: "Error",
          description: "Failed to initialize budget categories",
          variant: "destructive",
        });
      }
    },
    [currentMonth, budgetCategories, fetchBudgetsAndTransactions, toast, userCategories]
  );

  return {
    loading,
    budgetCategories,
    userCategories,
    smartSuggestions,
    smartBudgetLoading,
    lastMonthSpent,
    fetchBudgetsAndTransactions,
    updateBudgetAmount,
    createBudget,
    deleteBudget,
    copyFromLastMonth,
    resetBudget,
    generateSmartBudget,
    applySmartBudget,
    initializeFromCategories,
  };
};
