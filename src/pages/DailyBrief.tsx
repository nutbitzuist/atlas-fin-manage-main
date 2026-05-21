import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, CreditCard, PiggyBank, Receipt, Shield, Target, TrendingDown, Wallet } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { Layout } from "@/components/Layout";
import SEO from "@/components/SEO";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getBillsByUserId } from "@/services/bill-service";
import { getBudgetsByUserAndMonth } from "@/services/budget-service";
import { getSavingsGoalsByUserId } from "@/services/savings-goal-service";
import { getIncomeByUserId } from "@/services/income-service";
import { getDailyBriefByUserAndDate, upsertDailyBriefStatus } from "@/services/daily-brief-service";
import { buildCashFlowForecast, formatTHB } from "@/utils/planning";
import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";

type BriefAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  priority: "high" | "medium" | "low";
  icon: typeof AlertCircle;
};

type BriefStatus = "pending" | "completed";

const todayKey = () => new Date().toISOString().split("T")[0];

export default function DailyBrief() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [briefStatus, setBriefStatus] = useState<BriefStatus>("pending");
  const [actions, setActions] = useState<BriefAction[]>([]);
  const [summary, setSummary] = useState({
    cashBalance: 0,
    projectedCash: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    upcomingBillsTotal: 0,
    budgetUsage: 0,
    goalsBehind: 0,
  });

  const loadBrief = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        navigate("/login");
        return;
      }

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString().split("T")[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const nextSevenDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString().split("T")[0];

      const displayName = await getProfileDisplayName(userId, "User");
      const [
        briefResult,
        assetSummary,
        transactionsResult,
        budgetsResult,
        billsResult,
        goalsResult,
        incomeResult,
        liabilitySummary,
      ] = await Promise.all([
        getDailyBriefByUserAndDate(userId, todayKey()),
        getAssetSummary(userId, "active"),
        getTransactionsByUserId(userId, {}, "amount, category, description, merchant, transaction_date, type"),
        getBudgetsByUserAndMonth(userId, {
          month: monthStart,
        }),
        getBillsByUserId(userId, { orderBy: "due_date", ascending: true }),
        getSavingsGoalsByUserId(userId),
        getIncomeByUserId(userId, {
          orderBy: "start_date",
          ascending: true,
        }),
        getLiabilitySummary(userId, "active"),
      ]);

      setUserName(displayName);
      setBriefStatus(briefResult?.status === "completed" ? "completed" : "pending");

      const cashBalance = Number(assetSummary.totalCash || 0);
      const monthTransactions = (transactionsResult || []).filter(
        (transaction) => transaction.transaction_date >= monthStart && transaction.transaction_date <= monthEnd
      );
      const monthlyIncome = monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      const monthlyExpenses = monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      const budgetTotal = (budgetsResult || []).reduce((sum, budget) => sum + Number(budget.monthly_limit || 0), 0);
      const budgetUsage = budgetTotal > 0 ? (monthlyExpenses / budgetTotal) * 100 : 0;
      const upcomingBills = (billsResult || []).filter(
        (bill) => !bill.is_paid && bill.due_date >= todayKey() && bill.due_date <= nextSevenDays
      );
      const upcomingBillsTotal = upcomingBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
      const creditLimit = liabilitySummary.creditCards.reduce((sum, card) => sum + Number(card.credit_limit || 0), 0);
      const creditBalance = liabilitySummary.totalCreditCards;
      const creditUtilization = creditLimit > 0 ? (creditBalance / creditLimit) * 100 : 0;

      const forecast = buildCashFlowForecast({
        cashBalance,
        incomeSources: incomeResult || [],
        bills: billsResult || [],
        transactions: transactionsResult || [],
        days: 90,
      });

      const goalStatus = (goalsResult || []).map((goal) => {
        const current = Number(goal.current_amount || 0);
        const target = Number(goal.target_amount || 0);
        const progress = target > 0 ? (current / target) * 100 : 0;
        const targetDate = goal.target_date ? new Date(goal.target_date) : null;
        const daysLeft = targetDate ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const behind = Boolean(daysLeft !== null && daysLeft <= 90 && progress < 75 && progress < 100);
        return { ...goal, progress, behind };
      });
      const goalsBehind = goalStatus.filter((goal) => goal.behind).length;

      const nextActions: BriefAction[] = [];

      if (forecast.lowCashRisk) {
        nextActions.push({
          title: "Cash forecast needs attention",
          description: `Your 90-day projected cash is ${formatTHB(forecast.projectedCash)}. Review expenses and upcoming bills today.`,
          href: "/cash-flow",
          cta: "Review forecast",
          priority: "high",
          icon: Wallet,
        });
      }

      if (upcomingBills.length > 0) {
        nextActions.push({
          title: "Bills are due soon",
          description: `${upcomingBills.length} unpaid bill${upcomingBills.length === 1 ? "" : "s"} totaling ${formatTHB(upcomingBillsTotal)} are due within 7 days.`,
          href: "/bills",
          cta: "Check bills",
          priority: "high",
          icon: CalendarClock,
        });
      }

      if (budgetUsage >= 80) {
        nextActions.push({
          title: budgetUsage >= 100 ? "Budget exceeded" : "Budget is close to limit",
          description: `You have used ${budgetUsage.toFixed(0)}% of this month's planned budget.`,
          href: "/budget",
          cta: "Review budget",
          priority: budgetUsage >= 100 ? "high" : "medium",
          icon: TrendingDown,
        });
      }

      if (creditUtilization >= 30) {
        nextActions.push({
          title: "Credit utilization is elevated",
          description: `Current utilization is ${creditUtilization.toFixed(1)}%. Lower balances can improve financial resilience.`,
          href: "/liabilities",
          cta: "Open payoff plan",
          priority: creditUtilization >= 70 ? "high" : "medium",
          icon: CreditCard,
        });
      }

      if (goalsBehind > 0) {
        nextActions.push({
          title: "Savings goals need momentum",
          description: `${goalsBehind} goal${goalsBehind === 1 ? "" : "s"} may need higher monthly contributions to stay on track.`,
          href: "/savings-goals",
          cta: "Review goals",
          priority: "medium",
          icon: Target,
        });
      }

      if (nextActions.length === 0) {
        nextActions.push({
          title: "Log today's money movement",
          description: "Add any income or expenses from today so your forecasts, budgets, and insights stay accurate.",
          href: "/transactions",
          cta: "Open transactions",
          priority: "low",
          icon: Receipt,
        });
      }

      nextActions.push({
        title: "Check your financial health",
        description: "Review the top score-improving action and keep your progress visible.",
        href: "/financial-health",
        cta: "View health score",
        priority: "low",
        icon: Shield,
      });

      setActions(nextActions.slice(0, 5));
      setSummary({
        cashBalance,
        projectedCash: forecast.projectedCash,
        monthlyIncome,
        monthlyExpenses,
        upcomingBillsTotal,
        budgetUsage,
        goalsBehind,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load daily brief");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  const markComplete = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const payload = {
        user_id: userId,
        brief_date: todayKey(),
        status: "completed",
        completed_at: new Date().toISOString(),
        action_count: actions.length,
        top_action_title: actions[0]?.title || null,
        metadata: {
          cash_balance: summary.cashBalance,
          projected_cash: summary.projectedCash,
          monthly_income: summary.monthlyIncome,
          monthly_expenses: summary.monthlyExpenses,
        },
        updated_at: new Date().toISOString(),
      };

      await upsertDailyBriefStatus(payload);
      setBriefStatus("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete daily brief");
    } finally {
      setSaving(false);
    }
  };

  const topPriority = useMemo(() => actions.find((action) => action.priority === "high") || actions[0], [actions]);

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
      <SEO
        title="Daily Finance Brief"
        description="Review today's financial priorities, upcoming bills, cash flow risk, budgets, and savings progress."
        canonical="/daily-brief"
      />
      <div className="container mx-auto space-y-6 px-6 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Wallet className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Daily Finance Brief</h1>
            </div>
            <p className="mt-2 text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <Button onClick={markComplete} disabled={saving || briefStatus === "completed"}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {briefStatus === "completed" ? "Brief completed" : saving ? "Saving..." : "Mark complete"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Daily brief unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTHB(summary.cashBalance)}</div>
              <p className="text-xs text-muted-foreground">Across active cash accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">90-Day Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.projectedCash < 0 ? "text-destructive" : ""}`}>
                {formatTHB(summary.projectedCash)}
              </div>
              <p className="text-xs text-muted-foreground">After recent spending and bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.monthlyIncome - summary.monthlyExpenses < 0 ? "text-destructive" : "text-success"}`}>
                {formatTHB(summary.monthlyIncome - summary.monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">Income minus expenses this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.budgetUsage.toFixed(0)}%</div>
              <Progress value={Math.min(100, summary.budgetUsage)} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {topPriority && (
          <Card className={topPriority.priority === "high" ? "border-destructive/30" : "border-primary/20"}>
            <CardHeader>
              <CardTitle>Today's Focus</CardTitle>
              <CardDescription>The most useful action to take right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {(() => {
                      const Icon = topPriority.icon;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="font-semibold">{topPriority.title}</h2>
                    <p className="text-sm text-muted-foreground">{topPriority.description}</p>
                  </div>
                </div>
                <Button asChild className="shrink-0">
                  <Link to={topPriority.href}>
                    {topPriority.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Action List</CardTitle>
            <CardDescription>Keep the list short enough to finish today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.title} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{action.title}</h3>
                        <Badge variant={action.priority === "high" ? "destructive" : action.priority === "medium" ? "default" : "secondary"}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link to={action.href}>{action.cta}</Link>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary" />
              Quick Context
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Bills due within 7 days</p>
              <p className="mt-1 text-xl font-semibold">{formatTHB(summary.upcomingBillsTotal)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Goals needing attention</p>
              <p className="mt-1 text-xl font-semibold">{summary.goalsBehind}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Brief status</p>
              <p className="mt-1 text-xl font-semibold capitalize">{briefStatus}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
