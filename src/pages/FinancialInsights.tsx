import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Brain, CalendarClock, CheckCircle2, PiggyBank, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getProfileDisplayName } from "@/services/profile-service";
import { getBillsByUserId } from "@/services/bill-service";
import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";
import { buildCashFlowForecast, getCategorizationSuggestions } from "@/utils/planning";
import { getBudgetsByUserAndMonth } from "@/services/budget-service";
import { getSavingsGoalsByUserId } from "@/services/savings-goal-service";
import { getIncomeByUserId } from "@/services/income-service";

type Transaction = Pick<Tables<"transactions">, "amount" | "category" | "description" | "merchant" | "transaction_date" | "type">;
type Budget = Pick<Tables<"budgets">, "category" | "monthly_limit">;
type Bill = Pick<Tables<"bills">, "amount" | "due_date" | "is_paid" | "name">;
type SavingsGoal = Pick<Tables<"savings_goals">, "current_amount" | "name" | "target_amount" | "target_date">;
type IncomeSource = Pick<Tables<"income">, "amount" | "frequency" | "is_active">;

type Insight = {
  title: string;
  description: string;
  action: string;
  href: string;
  severity: "positive" | "warning" | "critical" | "neutral";
};

type CategoryTotal = {
  category: string;
  amount: number;
  limit?: number;
};

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currency.format(Number.isFinite(value) ? value : 0);

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

const getMonthlyIncome = (sources: IncomeSource[]) => {
  return sources.reduce((total, source) => {
    if (!source.is_active) return total;

    const amount = Number(source.amount || 0);
    const frequency = source.frequency.toLowerCase();

    if (frequency === "yearly" || frequency === "annually") return total + amount / 12;
    if (frequency === "quarterly") return total + amount / 3;
    if (frequency === "weekly") return total + amount * 4.33;
    if (frequency === "daily") return total + amount * 30;
    return total + amount;
  }, 0);
};

const getSeverityClasses = (severity: Insight["severity"]) => {
  switch (severity) {
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";
    case "critical":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-card text-card-foreground";
  }
};

const FinancialInsights = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [totals, setTotals] = useState({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [cashForecast, setCashForecast] = useState<ReturnType<typeof buildCashFlowForecast> | null>(null);
  const [categorySuggestionCount, setCategorySuggestionCount] = useState(0);

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const monthEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0), [now]);
  const next30Days = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30), [now]);
  const monthKey = toDateInput(monthStart);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const displayName = await getProfileDisplayName(userId, "User");
      const [
        transactionsResult,
        allTransactionsResult,
        budgetsData,
        billsResult,
        goalsResult,
        incomeResult,
        assetSummaryResult,
        liabilitySummaryResult,
      ] = await Promise.all([
        getTransactionsByUserId(userId, {
          startDate: toDateInput(monthStart),
          endDate: toDateInput(monthEnd),
        }, "amount, category, description, merchant, transaction_date, type"),
        getTransactionsByUserId(
          userId,
          {},
          "amount, category, description, merchant, transaction_date, type"
        ),
        getBudgetsByUserAndMonth(userId, { month: monthKey }),
        getBillsByUserId(userId, {
          dueDateFrom: toDateInput(now),
          dueDateTo: toDateInput(next30Days),
        }),
        getSavingsGoalsByUserId(userId),
        getIncomeByUserId(userId),
        getAssetSummary(userId, "active"),
        getLiabilitySummary(userId, "active"),
      ]);

      setUserName(displayName);
      setTransactions(transactionsResult as Transaction[] || []);
      setBudgets(budgetsData || []);
      setBills(billsResult || []);
      setGoals((goalsResult as SavingsGoal[]) || []);
      setIncomeSources((incomeResult || []) as IncomeSource[]);
      setTotals({
        totalAssets: assetSummaryResult.totalAssets,
        totalLiabilities: liabilitySummaryResult.totalLiabilities,
        netWorth: assetSummaryResult.totalAssets - liabilitySummaryResult.totalLiabilities,
      });
      setCategorySuggestionCount(getCategorizationSuggestions((allTransactionsResult as Transaction[]) || []).length);
      setCashForecast(buildCashFlowForecast({
        cashBalance: assetSummaryResult.totalCash,
        incomeSources: (incomeResult || []) as IncomeSource[],
        bills: billsResult || [],
        transactions: (allTransactionsResult as Transaction[]) || [],
        days: 90,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load financial insights");
    } finally {
      setLoading(false);
    }
  }, [monthEnd, monthKey, monthStart, next30Days, now]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const metrics = useMemo(() => {
    const expenses = transactions.filter((transaction) => transaction.type === "expense");
    const incomeTransactions = transactions.filter((transaction) => transaction.type === "income");
    const monthlyExpenses = expenses.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const observedIncome = incomeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const plannedIncome = getMonthlyIncome(incomeSources);
    const monthlyIncome = observedIncome > 0 ? observedIncome : plannedIncome;
    const savings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
    const debtRatio = totals.totalAssets > 0 ? (totals.totalLiabilities / totals.totalAssets) * 100 : 0;
    const unpaidBills = bills.filter((bill) => !bill.is_paid);
    const upcomingBillsTotal = unpaidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const budgetTotal = budgets.reduce((sum, budget) => sum + Number(budget.monthly_limit || 0), 0);

    const spendingByCategory = expenses.reduce<Record<string, number>>((acc, transaction) => {
      const category = transaction.category || "Other";
      acc[category] = (acc[category] || 0) + Number(transaction.amount || 0);
      return acc;
    }, {});

    const limitByCategory = budgets.reduce<Record<string, number>>((acc, budget) => {
      acc[budget.category] = Number(budget.monthly_limit || 0);
      return acc;
    }, {});

    const topCategories = Object.entries(spendingByCategory)
      .map(([category, amount]) => ({ category, amount, limit: limitByCategory[category] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const overBudgetCategories = topCategories.filter((category) => category.limit && category.amount > category.limit);
    const goalProgress = goals.map((goal) => ({
      name: goal.name,
      current: Number(goal.current_amount || 0),
      target: Number(goal.target_amount || 0),
      progress: goal.target_amount > 0 ? Math.min(100, (Number(goal.current_amount || 0) / Number(goal.target_amount)) * 100) : 0,
      targetDate: goal.target_date,
    }));

    return {
      budgetTotal,
      debtRatio,
      goalProgress,
      monthlyExpenses,
      monthlyIncome,
      overBudgetCategories,
      savings,
      savingsRate,
      topCategories,
      unpaidBills,
      upcomingBillsTotal,
    };
  }, [bills, budgets, goals, incomeSources, totals.totalAssets, totals.totalLiabilities, transactions]);

  const insights = useMemo<Insight[]>(() => {
    const results: Insight[] = [];

    if (metrics.monthlyIncome === 0) {
      results.push({
        title: "Add income sources",
        description: "Income data is missing, so savings rate and monthly runway are less accurate.",
        action: "Add income",
        href: "/income",
        severity: "warning",
      });
    } else if (metrics.savingsRate >= 20) {
      results.push({
        title: "Strong savings rate",
        description: `You are saving ${metrics.savingsRate.toFixed(1)}% of monthly income. Consider assigning part of this surplus to your highest priority goal.`,
        action: "Review goals",
        href: "/savings-goals",
        severity: "positive",
      });
    } else if (metrics.savingsRate < 0) {
      results.push({
        title: "Negative monthly cash flow",
        description: `Expenses exceed income by ${formatCurrency(Math.abs(metrics.savings))} this month. Start by reducing the largest flexible category.`,
        action: "Review expenses",
        href: "/expenses",
        severity: "critical",
      });
    } else {
      results.push({
        title: "Savings rate can improve",
        description: `Your current savings rate is ${metrics.savingsRate.toFixed(1)}%. A 20% target would add about ${formatCurrency(Math.max(0, metrics.monthlyIncome * 0.2 - metrics.savings))} more savings this month.`,
        action: "Open budget",
        href: "/budget",
        severity: "warning",
      });
    }

    if (metrics.overBudgetCategories.length > 0) {
      const category = metrics.overBudgetCategories[0];
      results.push({
        title: `${category.category} is over budget`,
        description: `This category is ${formatCurrency(category.amount - (category.limit || 0))} above its monthly limit.`,
        action: "Adjust budget",
        href: "/budget",
        severity: "critical",
      });
    } else if (metrics.budgetTotal > 0) {
      results.push({
        title: "Budgets are under control",
        description: "No top spending categories are currently above their configured monthly limits.",
        action: "View budget",
        href: "/budget",
        severity: "positive",
      });
    }

    if (metrics.upcomingBillsTotal > 0) {
      results.push({
        title: "Upcoming bills need cash coverage",
        description: `${metrics.unpaidBills.length} unpaid bill${metrics.unpaidBills.length === 1 ? "" : "s"} totaling ${formatCurrency(metrics.upcomingBillsTotal)} are due within 30 days.`,
        action: "View bills",
        href: "/bills",
        severity: "warning",
      });
    }

    if (cashForecast?.lowCashRisk) {
      results.push({
        title: "90-day cash forecast is tight",
        description: `Projected cash is ${formatCurrency(cashForecast.projectedCash)} after recent spending patterns and unpaid bills.`,
        action: "Open cash flow",
        href: "/cash-flow",
        severity: "critical",
      });
    } else if (cashForecast && cashForecast.projectedNetFlow > 0) {
      results.push({
        title: "Cash forecast has room to plan",
        description: `Projected monthly surplus is ${formatCurrency(cashForecast.projectedNetFlow)}. Consider assigning it to goals or high-interest debt.`,
        action: "Review goals",
        href: "/savings-goals",
        severity: "positive",
      });
    }

    if (categorySuggestionCount > 0) {
      results.push({
        title: "Transactions need category cleanup",
        description: `${categorySuggestionCount} transaction${categorySuggestionCount === 1 ? "" : "s"} have smarter category suggestions available.`,
        action: "Review transactions",
        href: "/transactions",
        severity: "neutral",
      });
    }

    if (metrics.debtRatio > 50) {
      results.push({
        title: "Debt load is elevated",
        description: `Liabilities are ${metrics.debtRatio.toFixed(1)}% of assets. Prioritize high-interest debt repayment before adding new commitments.`,
        action: "Review liabilities",
        href: "/liabilities",
        severity: "critical",
      });
    } else if (totals.totalLiabilities > 0) {
      results.push({
        title: "Debt ratio looks manageable",
        description: `Liabilities are ${metrics.debtRatio.toFixed(1)}% of assets. Keep tracking repayment progress monthly.`,
        action: "View net worth",
        href: "/net-worth",
        severity: "positive",
      });
    }

    const stalledGoal = metrics.goalProgress.find((goal) => goal.target > 0 && goal.progress < 25);
    if (stalledGoal) {
      results.push({
        title: `${stalledGoal.name} needs momentum`,
        description: `This goal is ${stalledGoal.progress.toFixed(1)}% funded. Automating a monthly transfer can make progress more consistent.`,
        action: "Open goals",
        href: "/savings-goals",
        severity: "neutral",
      });
    }

    return results.slice(0, 8);
  }, [categorySuggestionCount, cashForecast, metrics, totals.totalLiabilities]);

  if (loading) {
    return (
      <Layout userName={userName}>
        <SEO title="Financial Insights - Atlas Finance" description="Personalized financial insights and recommended actions." />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout userName={userName}>
      <SEO title="Financial Insights - Atlas Finance" description="Personalized financial insights and recommended actions." />
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Financial Insights</h1>
            </div>
            <p className="mt-2 text-muted-foreground">Personalized recommendations generated from your latest finance data.</p>
          </div>
          <Button onClick={loadInsights} variant="outline">Refresh insights</Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unable to load insights</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyIncome)}</div>
              <p className="text-xs text-muted-foreground">Observed this month or estimated from active income sources</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyExpenses)}</div>
              <p className="text-xs text-muted-foreground">Total expense transactions in the current month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <PiggyBank className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.savingsRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(metrics.savings)} estimated monthly surplus</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.netWorth)}</div>
              <p className="text-xs text-muted-foreground">Assets minus liabilities across active accounts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>Prioritized insights based on cash flow, budgets, bills, debt, and goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  Add transactions, budgets, bills, and savings goals to unlock personalized recommendations.
                </div>
              ) : (
                insights.map((insight) => (
                  <div key={insight.title} className={`rounded-lg border p-4 ${getSeverityClasses(insight.severity)}`}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {insight.severity === "positive" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          <h3 className="font-semibold">{insight.title}</h3>
                        </div>
                        <p className="text-sm opacity-90">{insight.description}</p>
                      </div>
                      <Button asChild size="sm" variant="secondary" className="shrink-0">
                        <Link to={insight.href}>
                          {insight.action}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Upcoming Bills
                </CardTitle>
                <CardDescription>Unpaid bills due in the next 30 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.unpaidBills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unpaid bills due soon.</p>
                ) : (
                  metrics.unpaidBills.slice(0, 5).map((bill) => (
                    <div key={`${bill.name}-${bill.due_date}`} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">Due {new Date(bill.due_date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline">{formatCurrency(Number(bill.amount || 0))}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Goal Progress
                </CardTitle>
                <CardDescription>Your closest savings goal progress.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.goalProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Create savings goals to see progress here.</p>
                ) : (
                  metrics.goalProgress.slice(0, 4).map((goal) => (
                    <div key={goal.name} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-muted-foreground">{goal.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={goal.progress} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.current)} saved</span>
                        <span>{formatCurrency(goal.target)} target</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Current month spending compared with configured category budgets.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.topCategories.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">No expense transactions found for this month.</div>
            ) : (
              <div className="space-y-4">
                {metrics.topCategories.map((category: CategoryTotal) => {
                  const progress = category.limit ? Math.min(100, (category.amount / category.limit) * 100) : 0;
                  return (
                    <div key={category.category} className="space-y-2">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div className="font-medium">{category.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(category.amount)}{category.limit ? ` / ${formatCurrency(category.limit)}` : ""}
                        </div>
                      </div>
                      {category.limit ? <Progress value={progress} /> : <div className="h-2 rounded-full bg-muted" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FinancialInsights;
