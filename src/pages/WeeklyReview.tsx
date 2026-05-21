import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import { AlertCircle, ArrowRight, BarChart3, CalendarCheck, CheckCircle2, Copy, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatTHB } from "@/utils/planning";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getBillsByUserId } from "@/services/bill-service";
import { getSavingsGoalsByUserId } from "@/services/savings-goal-service";
import { getBudgetsByUserAndMonth } from "@/services/budget-service";
import { getWeeklyReviewByUserAndWeekStart, upsertWeeklyReview } from "@/services/weekly-review-service";

type ReviewAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  priority: "high" | "medium" | "low";
};

type CategoryTotal = {
  category: string;
  amount: number;
};

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

export default function WeeklyReview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [status, setStatus] = useState<"pending" | "completed">("pending");
  const [actions, setActions] = useState<ReviewAction[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryTotal[]>([]);
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    netFlow: 0,
    previousExpenses: 0,
    expenseChange: 0,
    billsPaid: 0,
    billsDue: 0,
    goalsCompleted: 0,
    budgetUsage: 0,
  });

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const loadReview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      const previousWeekStart = subDays(weekStart, 7);
      const previousWeekEnd = subDays(weekEnd, 7);
      const monthStart = toDateInput(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));

      const displayName = await getProfileDisplayName(userId, "User");
      const [reviewResult, transactionsResult, previousTransactionsResult, billsResult, goalsResult, budgetsResult] = await Promise.all([
        getWeeklyReviewByUserAndWeekStart(userId, toDateInput(weekStart)),
        getTransactionsByUserId(userId, {
          startDate: toDateInput(weekStart),
          endDate: toDateInput(weekEnd),
        }, "amount, category, transaction_date, type"),
        getTransactionsByUserId(userId, {
          startDate: toDateInput(previousWeekStart),
          endDate: toDateInput(previousWeekEnd),
        }, "amount, type"),
        getBillsByUserId(userId, {
          dueDateFrom: toDateInput(weekStart),
          dueDateTo: toDateInput(weekEnd),
        }),
        getSavingsGoalsByUserId(userId),
        getBudgetsByUserAndMonth(userId, { month: monthStart }),
      ]);

      setUserName(displayName);
      setStatus(reviewResult?.status || "pending");

      const transactions = transactionsResult || [];
      const income = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      const expenses = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      const previousExpenses = (previousTransactionsResult || [])
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      const expenseChange = previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses) * 100 : 0;
      const billsPaid = (billsResult || []).filter((bill) => bill.is_paid).length;
      const billsDue = (billsResult || []).filter((bill) => !bill.is_paid).length;
      const goalsCompleted = (goalsResult || []).filter(
        (goal) => Number(goal.target_amount || 0) > 0 && Number(goal.current_amount || 0) >= Number(goal.target_amount || 0)
      ).length;
      const budgetTotal = (budgetsResult || []).reduce((sum, budget) => sum + Number(budget.monthly_limit || 0), 0);
      const budgetUsage = budgetTotal > 0 ? (expenses / budgetTotal) * 100 : 0;

      const byCategory = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce<Record<string, number>>((acc, transaction) => {
          const category = transaction.category || "Other";
          acc[category] = (acc[category] || 0) + Number(transaction.amount || 0);
          return acc;
        }, {});
      const categories = Object.entries(byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const nextActions: ReviewAction[] = [];
      if (income > 0 && expenses > income) {
        nextActions.push({
          title: "This week ran negative",
          description: `Expenses exceeded income by ${formatTHB(expenses - income)}.`,
          href: "/cash-flow",
          cta: "Review cash flow",
          priority: "high",
        });
      }
      if (expenseChange > 20) {
        nextActions.push({
          title: "Spending jumped this week",
          description: `Weekly expenses increased ${expenseChange.toFixed(0)}% compared with last week.`,
          href: "/expenses",
          cta: "Review expenses",
          priority: "medium",
        });
      }
      if (billsDue > 0) {
        nextActions.push({
          title: "Unpaid bills remain",
          description: `${billsDue} bill${billsDue === 1 ? "" : "s"} from this week still need attention.`,
          href: "/bills",
          cta: "Open bills",
          priority: "high",
        });
      }
      if (budgetUsage >= 80) {
        nextActions.push({
          title: "Budget pace is hot",
          description: `This week's spending equals ${budgetUsage.toFixed(0)}% of monthly budgeted amount.`,
          href: "/budget",
          cta: "Adjust budget",
          priority: "medium",
        });
      }
      if (nextActions.length === 0) {
        nextActions.push({
          title: "Plan next week's money move",
          description: "Pick one goal, debt, or budget category to improve next week.",
          href: "/financial-insights",
          cta: "Open insights",
          priority: "low",
        });
      }

      setTopCategories(categories);
      setActions(nextActions);
      setSummary({
        income,
        expenses,
        netFlow: income - expenses,
        previousExpenses,
        expenseChange,
        billsPaid,
        billsDue,
        goalsCompleted,
        budgetUsage,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load weekly review");
    } finally {
      setLoading(false);
    }
  }, [navigate, weekEnd, weekStart]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const markComplete = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      await upsertWeeklyReview({
        user_id: userId,
        week_start: toDateInput(weekStart),
        week_end: toDateInput(weekEnd),
        status: "completed",
        completed_at: new Date().toISOString(),
        focus_title: actions[0]?.title || null,
        summary,
        updated_at: new Date().toISOString(),
      });
      setStatus("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete weekly review");
    } finally {
      setSaving(false);
    }
  };

  const copySummary = async () => {
    const text = [
      `Atlas weekly review: ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
      `Income: ${formatTHB(summary.income)}`,
      `Expenses: ${formatTHB(summary.expenses)}`,
      `Net flow: ${formatTHB(summary.netFlow)}`,
      `Focus: ${actions[0]?.title || "Plan next week"}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Weekly review summary copied" });
  };

  if (loading) {
    return (
      <Layout userName={userName}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userName}>
      <SEO title="Weekly Money Review" description="Review weekly spending, cash flow, bills, goals, and next actions." canonical="/weekly-review" />
      <div className="container mx-auto space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Weekly Money Review</h1>
            </div>
            <p className="mt-2 text-muted-foreground">{format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={copySummary}>
              <Copy className="mr-2 h-4 w-4" />
              Copy summary
            </Button>
            <Button onClick={markComplete} disabled={saving || status === "completed"}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {status === "completed" ? "Review completed" : saving ? "Saving..." : "Mark complete"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Weekly review unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weekly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatTHB(summary.income)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weekly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatTHB(summary.expenses)}</div>
              {summary.previousExpenses > 0 && (
                <p className={`mt-1 text-xs ${summary.expenseChange <= 0 ? "text-success" : "text-destructive"}`}>
                  {summary.expenseChange > 0 ? "+" : ""}{summary.expenseChange.toFixed(0)}% vs last week
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netFlow >= 0 ? "text-success" : "text-destructive"}`}>
                {formatTHB(summary.netFlow)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weekly Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{status}</div>
              <p className="text-xs text-muted-foreground">{summary.billsPaid} bills paid, {summary.billsDue} due</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Focus</CardTitle>
              <CardDescription>One or two money moves for next week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.map((action) => (
                <div key={action.title} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{action.title}</h3>
                      <Badge variant={action.priority === "high" ? "destructive" : action.priority === "medium" ? "default" : "secondary"}>
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link to={action.href}>
                      {action.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Spending Concentration
              </CardTitle>
              <CardDescription>Top expense categories this week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses recorded this week.</p>
              ) : (
                topCategories.map((category) => {
                  const percent = summary.expenses > 0 ? (category.amount / summary.expenses) * 100 : 0;
                  return (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-muted-foreground">{formatTHB(category.amount)}</span>
                      </div>
                      <Progress value={percent} />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Goals completed</p>
                <p className="text-xl font-semibold">{summary.goalsCompleted}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Budget used this week</p>
                <p className="text-xl font-semibold">{summary.budgetUsage.toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Next action</p>
                <p className="text-sm font-semibold">{actions[0]?.title || "Plan next week"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
