import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useYear } from "@/contexts/YearContext";
import { Layout } from "@/components/Layout";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetAllocationChart } from "@/components/dashboard/AssetAllocationChart";
import { EmergencyFundWidget } from "@/components/dashboard/EmergencyFundWidget";
import { CreditUtilizationWidget } from "@/components/dashboard/CreditUtilizationWidget";
import { UpcomingBillsWidget, Bill } from "@/components/dashboard/UpcomingBillsWidget";
import { SavingsGoalsWidget, SavingsGoal } from "@/components/dashboard/SavingsGoalsWidget";
import { RecentTransactionsTable, Transaction } from "@/components/dashboard/RecentTransactionsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DataFreshnessBanner } from "@/components/dashboard/DataFreshnessBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, CalendarCheck, ArrowRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import SEO from "@/components/SEO";
import { format, startOfMonth } from "date-fns";
import { getProfileById } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getBillsByUserId } from "@/services/bill-service";
import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";
import { getLatestInsurancePolicyByUser } from "@/services/insurance-service";
import { getSavingsGoalsByUserId } from "@/services/savings-goal-service";
import { getMonthlyUpdateByUserAndMonth } from "@/services/monthly-update-service";
import { getNetWorthHistoryByUser } from "@/services/net-worth-history-service";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const { selectedYear } = useYear();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Data states
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [assetAllocation, setAssetAllocation] = useState<{ name: string; value: number }[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<{ date: string; netWorth: number; assets?: number; liabilities?: number }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [emergencyFundTargetMonths, setEmergencyFundTargetMonths] = useState(6);
  const [emergencyFundCurrentAmount, setEmergencyFundCurrentAmount] = useState(0);
  const [monthlyExpensesAvg, setMonthlyExpensesAvg] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [creditCardBalance, setCreditCardBalance] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  
  // Data freshness states
  const [dataFreshness, setDataFreshness] = useState<{label: string; lastUpdated: string | null; link: string}[]>([]);
  const [monthlyUpdateDone, setMonthlyUpdateDone] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/login");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        setUserEmail(session.user.email || "");
        fetchAllData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, selectedYear]);

  const fetchAllData = async (userId: string) => {
    await Promise.all([
      fetchUserProfile(userId),
      fetchAssets(userId),
      fetchLiabilities(userId),
      fetchTransactions(userId, selectedYear),
      fetchBills(userId),
      fetchSavingsGoals(userId),
      fetchNetWorthHistory(userId, selectedYear),
      fetchDataFreshness(userId),
      fetchMonthlyUpdateStatus(userId),
    ]);
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const data = await getProfileById(userId);
      setUserName(data?.full_name || "User");
      setEmergencyFundTargetMonths(data?.emergency_fund_target_months || 6);
      setEmergencyFundCurrentAmount(data?.emergency_fund_current_amount || 0);
    } catch (error) {
      console.warn("Error fetching user profile:", error instanceof Error ? error.message : error);
      setUserName("User");
      setEmergencyFundTargetMonths(6);
      setEmergencyFundCurrentAmount(0);
    }
  };

  const fetchAssets = async (userId: string) => {
    try {
      const summary = await getAssetSummary(userId, "active");

      const nonZeroAllocation = summary.categoryBreakdown.filter((item) => item.amount > 0);

      setTotalAssets(summary.totalAssets);
      setCashBalance(summary.totalCash);
      setAssetAllocation(nonZeroAllocation.map((item) => ({ name: item.category, value: item.amount })));
    } catch (error) {
      console.error("Error fetching assets:", error);
      setTotalAssets(0);
      setCashBalance(0);
      setAssetAllocation([]);
    }
  };

  const fetchLiabilities = async (userId: string) => {
    try {
      const summary = await getLiabilitySummary(userId, "active");

      const totalCreditLimit = summary.creditCards.reduce((sum, card) => sum + Number(card.credit_limit || 0), 0);

      setTotalLiabilities(summary.totalLiabilities);
      setCreditCardBalance(summary.totalCreditCards);
      setCreditLimit(totalCreditLimit > 0 ? totalCreditLimit : 100000);
    } catch (error) {
      console.error("Error fetching liabilities:", error);
      setTotalLiabilities(0);
      setCreditCardBalance(0);
      setCreditLimit(100000);
    }
  };

  const fetchTransactions = async (userId: string, year: number) => {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
    const data = await getTransactionsByUserId(
      userId,
      {
        startDate: startDate.split("T")[0],
        endDate: endDate.split("T")[0],
        orderBy: "transaction_date",
        ascending: false,
      },
      "*"
    );

    if (data) {
      const filteredByYear = data.filter((transaction) => {
        const transDate = new Date(transaction.transaction_date);
        return transDate >= new Date(startDate) && transDate <= new Date(endDate);
      });
      setTransactions(filteredByYear as Transaction[]);

      // Calculate yearly cumulative stats to show in "Monthly Cash Flow" tile for past years
      // Or just calculate average monthly for the selected year
      const income = filteredByYear
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = filteredByYear
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // If it's a past year, show monthly average. If current year, show current month
      if (year === new Date().getFullYear()) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyData = filteredByYear.filter(t =>
          new Date(t.transaction_date) >= firstDayOfMonth
        );

        setMonthlyIncome(monthlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0));
        setMonthlyExpenses(monthlyData.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0));
      } else {
        setMonthlyIncome(income / 12);
        setMonthlyExpenses(expenses / 12);
      }

      // Calculate average monthly expenses for emergency fund
      // Count only actual months with data to avoid dividing by empty months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentExpenses = filteredByYear.filter(t =>
        t.type === 'expense' && new Date(t.transaction_date) >= threeMonthsAgo
      );

      if (recentExpenses.length > 0) {
        // Group expenses by month to count actual months with data
        const monthsWithData = new Set<string>();
        recentExpenses.forEach(t => {
          const date = new Date(t.transaction_date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          monthsWithData.add(monthKey);
        });

        const totalExpenses = recentExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
        const actualMonthCount = monthsWithData.size;
        const avgMonthly = totalExpenses / actualMonthCount; // Divide by actual months with data
        setMonthlyExpensesAvg(avgMonthly);
      } else {
        setMonthlyExpensesAvg(expenses); // Fallback to current month if no history
      }
    }
  };

  const fetchBills = async (userId: string) => {
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const bills = await getBillsByUserId(userId, {
        dueDateFrom: today.toISOString().split("T")[0],
        dueDateTo: nextWeek.toISOString().split("T")[0],
        orderBy: "due_date",
        ascending: true,
      });

      setBills((bills || []) as Bill[]);
    } catch (error) {
      console.warn("Error fetching bills:", error);
      setBills([]);
    }
  };

  const fetchSavingsGoals = async (userId: string) => {
    try {
      const data = await getSavingsGoalsByUserId(userId);

      setSavingsGoals((data || []) as SavingsGoal[]);

      // Sync Emergency Fund widget with the default savings goal if it exists
      const defaultGoal = data?.find(g => g.is_default);
      if (defaultGoal) {
        setEmergencyFundCurrentAmount(Number(defaultGoal.current_amount || 0));
      } else {
        setEmergencyFundCurrentAmount(0);
      }
    } catch (error) {
      console.warn("Error fetching savings goals:", error);
      setSavingsGoals([]);
      setEmergencyFundCurrentAmount(0);
    }
  };

  const fetchDataFreshness = async (userId: string) => {
    const getLatestUpdatedAt = (rows: Array<{ updated_at?: string | null }>) => {
      return rows.reduce<string | null>((latest, row) => {
        if (!row.updated_at) return latest;
        if (!latest) return row.updated_at;
        return row.updated_at > latest ? row.updated_at : latest;
      }, null);
    };

    try {
      // Query the most recent updated_at from key tables
      const [assetsSummary, liabilitySummary, insuranceRes, transRes] = await Promise.all([
        getAssetSummary(userId, "active"),
        getLiabilitySummary(userId, "active"),
        getLatestInsurancePolicyByUser(userId),
        getTransactionsByUserId(userId, { orderBy: "updated_at", ascending: false }, "updated_at"),
      ]);

      const latestCashUpdate = getLatestUpdatedAt(assetsSummary.cashAccounts);
      const latestInvestUpdate = getLatestUpdatedAt(assetsSummary.investments);
      const latestCreditCardUpdate = getLatestUpdatedAt(liabilitySummary.creditCards);
      const latestLoanUpdate = getLatestUpdatedAt(liabilitySummary.loans);

      const items = [
        { label: "Cash", lastUpdated: latestCashUpdate, link: "/assets/cash" },
        { label: "Investments", lastUpdated: latestInvestUpdate, link: "/assets/investments" },
        { label: "Credit Cards", lastUpdated: latestCreditCardUpdate, link: "/liabilities/credit-cards" },
        { label: "Loans", lastUpdated: latestLoanUpdate, link: "/liabilities/loans" },
        { label: "Insurance", lastUpdated: insuranceRes || null, link: "/insurance" },
        { label: "Transactions", lastUpdated: transRes?.[0]?.updated_at || null, link: "/expenses" },
      ].filter(item => item.lastUpdated !== null); // Only show sections that have data

      setDataFreshness(items);
    } catch (error) {
      console.warn("Error fetching data freshness:", error);
      setDataFreshness([]);
    }
  };

  const fetchMonthlyUpdateStatus = async (userId: string) => {
    try {
      const monthStr = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const data = await getMonthlyUpdateByUserAndMonth(userId, monthStr);

      setMonthlyUpdateDone(data?.status === "completed");
    } catch (error) {
      console.warn("Error checking monthly update:", error);
      setMonthlyUpdateDone(false);
    }
  };

  const fetchNetWorthHistory = async (userId: string, year: number) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const data = await getNetWorthHistoryByUser(userId, {
      startDate,
      endDate,
      orderBy: "date",
      ascending: true,
      limit: 12,
    });

    if (data && data.length > 0) {
      const history = data.map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short' }),
        netWorth: Number(record.net_worth),
        assets: Number(record.total_assets),
        liabilities: Number(record.total_liabilities)
      }));
      setNetWorthHistory(history);
    } else {
      // If no history, create a placeholder with current net worth
      const currentNetWorth = totalAssets - totalLiabilities;
      setNetWorthHistory([
        { date: new Date().toLocaleDateString('en-US', { month: 'short' }), netWorth: currentNetWorth }
      ]);
    }
  };

  // Calculate current net worth
  useEffect(() => {
    const currentNetWorth = totalAssets - totalLiabilities;
    setNetWorth(currentNetWorth);
  }, [totalAssets, totalLiabilities]);

  // Calculate net worth change
  const getNetWorthChange = () => {
    if (netWorthHistory.length < 2) return { change: 0, percentage: 0 };

    const current = netWorthHistory[netWorthHistory.length - 1].netWorth;
    const previous = netWorthHistory[netWorthHistory.length - 2].netWorth;
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;

    return { change, percentage };
  };

  const getAssetsChange = () => {
    if (netWorthHistory.length < 2) return { change: 0, percentage: 0 };

    const current = netWorthHistory[netWorthHistory.length - 1].assets || 0;
    const previous = netWorthHistory[netWorthHistory.length - 2].assets || 0;
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;

    return { change, percentage };
  };

  const getLiabilitiesChange = () => {
    if (netWorthHistory.length < 2) return { change: 0, percentage: 0 };

    const current = netWorthHistory[netWorthHistory.length - 1].liabilities || 0;
    const previous = netWorthHistory[netWorthHistory.length - 2].liabilities || 0;
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;

    return { change, percentage };
  };

  const { change: netWorthChange, percentage: netWorthChangePercentage } = getNetWorthChange();
  const { percentage: assetsChangePercentage } = getAssetsChange();
  const { percentage: liabilitiesChangePercentage } = getLiabilitiesChange();
  const monthlyCashFlow = monthlyIncome - monthlyExpenses;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('page.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout userName={userName} userEmail={userEmail}>
      <SEO
        title="Dashboard"
        description="View your complete financial overview including net worth, assets, liabilities, income, expenses, and cash flow. Track your financial goals and monitor your financial health in real-time."
        keywords="financial dashboard, net worth tracker, asset tracking, personal finance overview, wealth dashboard"
        canonical="/dashboard"
      />
      <div className="container mx-auto px-6 py-8">
        {/* Header with Quick Actions */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('page.dashboard')}</h2>
          <p className="text-muted-foreground">{t('page.welcomeBack')}</p>
        </div>

        {/* Quick Action Buttons */}
        <QuickActions onRefresh={() => session && fetchAllData(session.user.id)} />

        {/* Data Freshness Banner */}
        <DataFreshnessBanner
          items={dataFreshness}
          monthlyUpdateDone={monthlyUpdateDone}
          currentMonth={format(new Date(), "MMMM yyyy")}
        />

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Start with today&apos;s finance brief</h3>
                  <p className="text-sm text-muted-foreground">
                    Review bills, cash flow risk, budget pace, and the one action that matters today.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/daily-brief")} className="shrink-0">
                Open brief
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Run your weekly money review</h3>
                <p className="text-sm text-muted-foreground">
                    Compare this week, find spending changes, and choose next week&apos;s focus.
                </p>
                </div>
              </div>
              <Button onClick={() => navigate("/weekly-review")} variant="outline" className="shrink-0">
                Open review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <NetWorthCard
            netWorth={netWorth}
            change={netWorthChange}
            changePercentage={netWorthChangePercentage}
          />
          <StatCard
            title={t('page.totalAssets')}
            value={totalAssets}
            icon={TrendingUp}
            iconColor="text-success"
            trendValue={Number(assetsChangePercentage.toFixed(1))}
            trendLabel="vs last month"
          />
          <StatCard
            title={t('page.totalLiabilities')}
            value={totalLiabilities}
            icon={TrendingDown}
            iconColor="text-destructive"
            trendValue={Number(liabilitiesChangePercentage.toFixed(1))}
            trendLabel="vs last month"
          />
          <StatCard
            title={t('page.monthlyCashFlow')}
            value={monthlyCashFlow}
            icon={Wallet}
            iconColor={monthlyCashFlow >= 0 ? "text-success" : "text-destructive"}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <NetWorthChart data={netWorthHistory.length > 0 ? netWorthHistory : [
            { date: new Date().toLocaleDateString('en-US', { month: 'short' }), netWorth }
          ]} />
          <AssetAllocationChart data={assetAllocation.length > 0 ? assetAllocation : [
            { name: "No Assets", value: 1 }
          ]} />
        </div>

        {/* Quick Stats Widgets */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <EmergencyFundWidget
            currentAmount={emergencyFundCurrentAmount}
            targetAmount={monthlyExpensesAvg * emergencyFundTargetMonths}
          />
          <CreditUtilizationWidget
            currentBalance={creditCardBalance}
            creditLimit={creditLimit}
          />
          <UpcomingBillsWidget bills={bills} />
          <SavingsGoalsWidget goals={savingsGoals} />
        </div>

        {/* Recent Transactions Table */}
        <RecentTransactionsTable
          transactions={transactions}
          onRowClick={(transaction) => {
            // Transaction row clicked - could navigate to detail view in future
          }}
        />
      </div>
    </Layout>
  );
};

export default Index;
