import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Circle,
  Wallet,
  TrendingUp,
  Receipt,
  CreditCard,
  Shield,
  Calculator,
  ArrowRight,
  PartyPopper,
  Save,
  Calendar,
  Copy,
  FileText,
  WalletCards,
  LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { formatTHB } from "@/utils/planning";
import SEO from "@/components/SEO";
import { getErrorMessage } from "@/utils/errors";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getBillsByUserId } from "@/services/bill-service";
import { upsertMonthlyUpdate, getMonthlyUpdateByUserAndMonth, type MonthlyUpdatePayload } from "@/services/monthly-update-service";
import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";
import { getNetWorthHistoryByUser, upsertNetWorthSnapshot } from "@/services/net-worth-history-service";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  link: string;
  checked: boolean;
}

interface MonthlySummary {
  income: number;
  expenses: number;
  netFlow: number;
  previousNetFlow: number;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  debtPayments: number;
  unpaidBills: number;
  unpaidBillsTotal: number;
  taxDeductibleContributions: number;
  topCategories: { category: string; spent: number; suggestedBudget: number }[];
}

export default function MonthlyUpdate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [isSnapshotted, setIsSnapshotted] = useState(false);
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const [summary, setSummary] = useState<MonthlySummary>({
    income: 0,
    expenses: 0,
    netFlow: 0,
    previousNetFlow: 0,
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    debtPayments: 0,
    unpaidBills: 0,
    unpaidBillsTotal: 0,
    taxDeductibleContributions: 0,
    topCategories: [],
  });

  const currentMonth = startOfMonth(new Date());
  const monthLabel = format(new Date(), "MMMM yyyy");

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      key: "cash_updated",
      label: "Update Cash & Bank Balances",
      description: "Review and update all bank account balances to reflect current amounts",
      icon: Wallet,
      link: "/assets/cash",
      checked: false
    },
    {
      key: "investments_updated",
      label: "Review Investment Values",
      description: "Update mutual fund NAVs, stock prices, and trading account equity",
      icon: TrendingUp,
      link: "/assets/investments",
      checked: false
    },
    {
      key: "expenses_reviewed",
      label: "Confirm All Expenses Entered",
      description: "Make sure all expenses for this month have been recorded",
      icon: Receipt,
      link: "/expenses",
      checked: false
    },
    {
      key: "bills_paid_confirmed",
      label: "Verify Bills Paid",
      description: "Confirm all bills for this month have been paid and marked accordingly",
      icon: CreditCard,
      link: "/bills",
      checked: false
    },
    {
      key: "insurance_reviewed",
      label: "Check Insurance Renewals",
      description: "Review insurance policies for upcoming renewals and payment status",
      icon: Shield,
      link: "/insurance",
      checked: false
    },
    {
      key: "budget_set",
      label: "Set Next Month's Budget",
      description: "Create or copy budget for the upcoming month",
      icon: Calculator,
      link: "/budget",
      checked: false
    }
  ]);

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      setUserName(await getProfileDisplayName(session.user.id));

      await loadMonthlyUpdate(session.user.id);
    } catch (error) {
      console.error("Error:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyUpdate = async (userId: string) => {
    try {
      const monthStr = format(currentMonth, "yyyy-MM-dd");
      const data = await getMonthlyUpdateByUserAndMonth(userId, monthStr);

      if (data) {
        setStatus(data.status);
        setNotes(data.notes || "");
        setChecklist(prev => prev.map(item => ({
          ...item,
          checked: Boolean(data[item.key as keyof typeof data])
        })));

        const monthStart = format(currentMonth, "yyyy-MM-01");
        const monthEnd = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), "yyyy-MM-dd");
        const snapshot = await getNetWorthHistoryByUser(userId, {
          startDate: monthStart,
          endDate: monthEnd,
          limit: 1,
          ascending: false,
        });

        if (snapshot && snapshot.length > 0) {
          setIsSnapshotted(true);
        }
      }

      await loadMonthlySummary(userId);
    } catch (error) {
      console.error("Error loading monthly update:", error);
    }
  };

  const loadMonthlySummary = async (userId: string) => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const previousStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const previousEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    const monthStartStr = format(monthStart, "yyyy-MM-dd");
    const monthEndStr = format(monthEnd, "yyyy-MM-dd");
    const previousStartStr = format(previousStart, "yyyy-MM-dd");
    const previousEndStr = format(previousEnd, "yyyy-MM-dd");

    const [transactions, previousTransactions, billsRes, assetSummary, liabilitySummary] = await Promise.all([
      getTransactionsByUserId(
        userId,
        { startDate: monthStartStr, endDate: monthEndStr },
        "amount, category, transaction_date, type"
      ),
      getTransactionsByUserId(
        userId,
        { startDate: previousStartStr, endDate: previousEndStr },
        "amount, type"
      ),
      getBillsByUserId(userId, {
        dueDateFrom: monthStartStr,
        dueDateTo: monthEndStr,
      }),
      getAssetSummary(userId, "active"),
      getLiabilitySummary(userId, "active"),
    ]);

    const monthTransactions = transactions || [];
    const previousMonthTransactions = previousTransactions || [];
    const income = monthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const previousIncome = (previousMonthTransactions)
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const previousExpenses = (previousMonthTransactions)
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const spendingByCategory = monthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce<Record<string, number>>((acc, transaction) => {
        const category = transaction.category || "Other";
        acc[category] = (acc[category] || 0) + Number(transaction.amount || 0);
        return acc;
      }, {});

    const topCategories = Object.entries(spendingByCategory)
      .map(([category, spent]) => ({
        category,
        spent,
        suggestedBudget: Math.ceil((spent * 1.05) / 100) * 100,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    const unpaidBills = (billsRes || []).filter((bill) => !bill.is_paid);
    const debtPayments = [
      ...liabilitySummary.creditCards.map((card) => Number(card.minimum_payment || 0)),
      ...liabilitySummary.loans.map((loan) => Number(loan.monthly_payment || 0)),
    ].reduce((sum, payment) => sum + payment, 0);
    const taxDeductibleContributions = (assetSummary.investments || [])
      .filter((investment) => ["RMF", "SSF", "Thai ESG"].includes(investment.fund_category || ""))
      .reduce((sum, investment) => sum + Number(investment.this_year_contribution || 0), 0);
    const netWorth = assetSummary.totalAssets - liabilitySummary.totalLiabilities;

    setSummary({
      income,
      expenses,
      netFlow: income - expenses,
      previousNetFlow: previousIncome - previousExpenses,
      netWorth,
      totalAssets: assetSummary.totalAssets,
      totalLiabilities: liabilitySummary.totalLiabilities,
      debtPayments,
      unpaidBills: unpaidBills.length,
      unpaidBillsTotal: unpaidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
      taxDeductibleContributions,
      topCategories,
    });
  };

  const toggleItem = async (key: string) => {
    const updated = checklist.map(item =>
      item.key === key ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    await saveProgress(updated);
  };

  const saveProgress = async (items?: ChecklistItem[]) => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const currentItems = items || checklist;
      const allChecked = currentItems.every(item => item.checked);
      const anyChecked = currentItems.some(item => item.checked);

      const newStatus = allChecked ? "completed" : anyChecked ? "in_progress" : "pending";

      const updateData: MonthlyUpdatePayload = {
        user_id: session.user.id,
        month: format(currentMonth, "yyyy-MM-dd"),
        status: newStatus,
        notes: notes,
        ...(allChecked && !status.includes("completed") ? { completed_at: new Date().toISOString() } : {}),
      };

      const checklistData = currentItems.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.key] = item.checked;
        return acc;
      }, {});

      const upsertPayload: MonthlyUpdatePayload = {
        ...updateData,
        ...checklistData,
      };

      const updated = await upsertMonthlyUpdate(upsertPayload);

      setStatus(newStatus);
      
      // AUTO-SNAPSHOT: If this is the first time reaching "completed" this month, take a snapshot automatically.
      if (allChecked && status !== "completed" && !isSnapshotted) {
        toast.info("Checklist complete! Automatically saving your Net Worth snapshot...");
        await handleTakeSnapshot();
      } else if (allChecked && status !== "completed") {
        toast.success("Monthly update completed! 🎉");
      }
    } catch (error: unknown) {
      console.error("Error saving:", error);
      toast.error(getErrorMessage(error, "Failed to save progress"));
    } finally {
      setSaving(false);
    }
  };

  const handleTakeSnapshot = async () => {
    try {
      setTakingSnapshot(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const snapshotDate = format(currentMonth, "yyyy-MM-dd");
      await upsertNetWorthSnapshot(session.user.id, {
        date: snapshotDate,
        totalAssets: summary.totalAssets,
        totalLiabilities: summary.totalLiabilities,
      });
      setIsSnapshotted(true);
      toast.success("Net Worth snapshot locked in! Your history is updated.");
    } catch (error: unknown) {
      console.error("Error saving snapshot:", error);
      toast.error(getErrorMessage(error, "Failed to save snapshot"));
    } finally {
      setTakingSnapshot(false);
    }
  };

  const completedCount = checklist.filter(item => item.checked).length;
  const totalCount = checklist.length;
  const progressPercent = (completedCount / totalCount) * 100;
  const isCompleted = status === "completed";
  const netFlowChange = summary.netFlow - summary.previousNetFlow;

  const copyMonthlySummary = async () => {
    const text = [
      `Atlas monthly review: ${monthLabel}`,
      `Net worth: ${formatTHB(summary.netWorth)}`,
      `Income: ${formatTHB(summary.income)}`,
      `Expenses: ${formatTHB(summary.expenses)}`,
      `Net cash flow: ${formatTHB(summary.netFlow)}`,
      `Unpaid bills: ${summary.unpaidBills} (${formatTHB(summary.unpaidBillsTotal)})`,
      `Top focus: ${summary.netFlow < 0 ? "Restore positive cash flow" : "Assign surplus to goals or debt"}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    toast.success("Monthly summary copied");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout userName={userName}>
      <SEO
        title="Monthly Financial Update"
        description="Complete your monthly financial review checklist to keep your data accurate and up to date."
        keywords="monthly financial review, financial update, budget review, financial checklist"
        canonical="/monthly-update"
      />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Monthly Financial Update</h1>
          </div>
          <p className="text-muted-foreground">
            {monthLabel} — Review and update your financial data
          </p>
        </div>

        {/* Monthly Report */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTHB(summary.netWorth)}</div>
              <p className="text-xs text-muted-foreground">
                {formatTHB(summary.totalAssets)} assets, {formatTHB(summary.totalLiabilities)} liabilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netFlow >= 0 ? "text-success" : "text-destructive"}`}>
                {formatTHB(summary.netFlow)}
              </div>
              <p className={`text-xs ${netFlowChange >= 0 ? "text-success" : "text-destructive"}`}>
                {netFlowChange >= 0 ? "+" : ""}{formatTHB(netFlowChange)} vs last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Debt Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTHB(summary.debtPayments)}</div>
              <p className="text-xs text-muted-foreground">Minimum card payments plus loan payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tax Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTHB(summary.taxDeductibleContributions)}</div>
              <p className="text-xs text-muted-foreground">RMF, SSF, and Thai ESG tracked this year</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Monthly Close Summary
              </CardTitle>
              <CardDescription>Use this as your quick report before locking the month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Income</p>
                  <p className="text-xl font-semibold text-success">{formatTHB(summary.income)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-xl font-semibold text-destructive">{formatTHB(summary.expenses)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Unpaid bills</p>
                  <p className="text-xl font-semibold">{summary.unpaidBills} / {formatTHB(summary.unpaidBillsTotal)}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">
                  {summary.netFlow < 0 ? "Next month focus: restore positive cash flow" : "Next month focus: assign the surplus"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {summary.netFlow < 0
                    ? "Start with your top spending category, then check bills and debt payments before adding new goals."
                    : "Decide how much of this month's surplus should go to savings goals, investments, or high-interest debt."}
                </p>
              </div>

              <Button variant="outline" onClick={copyMonthlySummary}>
                <Copy className="h-4 w-4 mr-2" />
                Copy monthly summary
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-primary" />
                Suggested Next-Month Budgets
              </CardTitle>
              <CardDescription>Based on this month's top expense categories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add expenses this month to generate budget suggestions.</p>
              ) : (
                summary.topCategories.map((category) => (
                  <div key={category.category} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-xs text-muted-foreground">Spent {formatTHB(category.spent)} this month</p>
                    </div>
                    <Badge variant="outline">{formatTHB(category.suggestedBudget)}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">
                  {completedCount} / {totalCount}
                </p>
                <p className="text-sm text-muted-foreground">tasks completed</p>
              </div>
              <Badge
                variant={isCompleted ? "default" : status === "in_progress" ? "secondary" : "outline"}
                className={`text-sm px-4 py-1 ${isCompleted ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              >
                {isCompleted ? "✓ Completed" : status === "in_progress" ? "In Progress" : "Not Started"}
              </Badge>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Completion celebration */}
        {isCompleted && (
          <Card className="mb-8 border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                    {monthLabel} Review Complete!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your financial data is up to date. Great job staying on top of your finances!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action: Snapshot when completed */}
        {isCompleted && !isSnapshotted && (
          <Card className="mb-8 border-2 border-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Step 2: Lock in your Net Worth
              </CardTitle>
              <CardDescription>
                Now that your data is updated, take a snapshot to record your progress in your history chart.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleTakeSnapshot} 
                className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={takingSnapshot}
              >
                {takingSnapshot ? "Recording Snapshot..." : "Save Monthly Snapshot"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        <div className="space-y-3 mb-8">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.key}
                className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
                  item.checked
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/5"
                    : "hover:border-primary/30"
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item.key)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      {item.checked ? (
                        <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="h-7 w-7 text-muted-foreground/40" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${item.checked ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                        <p className={`font-medium ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                          {item.label}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Navigate button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      Go <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Notes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Monthly Notes</CardTitle>
            <CardDescription>
              Add any notes about this month's financial status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Received bonus this month, increased savings goal contribution..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={() => saveProgress()}
          size="lg"
          className="w-full gap-2"
          disabled={saving}
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving..." : "Save Progress"}
        </Button>
      </div>
    </Layout>
  );
}
