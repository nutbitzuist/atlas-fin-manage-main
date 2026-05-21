import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useYear } from "@/contexts/YearContext";
import { buildCashFlowForecast, formatTHB } from "@/utils/planning";
import { getBillsByUserId } from "@/services/bill-service";
import { getAssetSummary } from "@/services/financial-overview-service";
import { getIncomeByUserId } from "@/services/income-service";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import SEO from "@/components/SEO";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from "recharts";

const CashFlow = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const { selectedYear, selectedMonth } = useYear();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; income: number; expense: number; netFlow: number }>>([]);
  const [incomeCategories, setIncomeCategories] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [expenseCategories, setExpenseCategories] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [forecast, setForecast] = useState<ReturnType<typeof buildCashFlowForecast> | null>(null);
  const [scenario, setScenario] = useState({
    oneTimePurchase: 0,
    monthlyIncomeChange: 0,
    monthlyExpenseChange: 0,
    extraDebtPayment: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/login");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchUserProfile(session.user.id);
        fetchCashFlowData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, selectedYear, selectedMonth]);

  const fetchUserProfile = async (userId: string) => {
    setUserName(await getProfileDisplayName(userId));
  };

  const fetchCashFlowData = async (userId: string) => {
    try {
      const [transactions, assetSummary, incomeResult, billsResult] = await Promise.all([
        getTransactionsByUserId(
          userId,
          { orderBy: "transaction_date", ascending: true },
          "*"
        ),
        getAssetSummary(userId, "active"),
        getIncomeByUserId(userId, {
          orderBy: "start_date",
          ascending: true,
        }),
        getBillsByUserId(userId, {
          orderBy: "due_date",
          ascending: true,
        }),
      ]);

      if (!transactions) {
        return;
      }

      const data = transactions || [];
      const cashBalance = assetSummary.totalCash;

      setForecast(buildCashFlowForecast({
        cashBalance,
        incomeSources: incomeResult || [],
        bills: billsResult || [],
        transactions: data,
        days: 90,
      }));

      if (data && data.length > 0) {
        // Calculate relevant totals based on selected period
        const filteredTransactions = data.filter(t => {
          const transDate = new Date(t.transaction_date);
          const matchesYear = transDate.getFullYear() === selectedYear;
          const matchesMonth = selectedMonth === null || (transDate.getMonth() + 1) === selectedMonth;
          return matchesYear && matchesMonth;
        });

        const income = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setTotalIncome(income);
        setTotalExpenses(expenses);

        // Generate trend data
        // If specific month: Show last 6 months up to that month
        // If all months: Show Jan-Dec for that year
        const monthlyTrends: Record<string, { income: number; expense: number }> = {};
        
        if (selectedMonth) {
          // Trend leading up to selected month
          const endDate = new Date(selectedYear, selectedMonth - 1, 1);
          const startDate = new Date(endDate);
          startDate.setMonth(startDate.getMonth() - 5);
          
          for (let i = 0; i < 6; i++) {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + i);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            monthlyTrends[monthKey] = { income: 0, expense: 0 };
          }

          data.forEach(t => {
            const transDate = new Date(t.transaction_date);
            const monthKey = transDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (monthlyTrends[monthKey]) {
              if (t.type === 'income') {
                monthlyTrends[monthKey].income += Number(t.amount);
              } else if (t.type === 'expense') {
                monthlyTrends[monthKey].expense += Number(t.amount);
              }
            }
          });
        } else {
          // Full year trend
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          months.forEach(m => monthlyTrends[m] = { income: 0, expense: 0 });

          data.forEach(t => {
            const transDate = new Date(t.transaction_date);
            if (transDate.getFullYear() === selectedYear) {
              const monthKey = months[transDate.getMonth()];
              if (t.type === 'income') {
                monthlyTrends[monthKey].income += Number(t.amount);
              } else if (t.type === 'expense') {
                monthlyTrends[monthKey].expense += Number(t.amount);
              }
            }
          });
        }

        const monthlyArray = Object.entries(monthlyTrends).map(([month, d]) => ({
          month,
          income: d.income,
          expense: d.expense,
          netFlow: d.income - d.expense
        }));

        setMonthlyData(monthlyArray);

        // Generate income categories breakdown
        const incomeByCategory: Record<string, number> = {};
        filteredTransactions
          .filter(t => t.type === 'income')
          .forEach(t => {
            const category = t.category || 'Other';
            incomeByCategory[category] = (incomeByCategory[category] || 0) + Number(t.amount);
          });

        const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
        const incomeArray = Object.entries(incomeByCategory).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));
        setIncomeCategories(incomeArray);

        // Generate expense categories breakdown
        const expenseByCategory: Record<string, number> = {};
        filteredTransactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const category = t.category || 'Other';
            expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(t.amount);
          });

        const expenseArray = Object.entries(expenseByCategory).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));
        setExpenseCategories(expenseArray);
      } else {
        setTotalIncome(0);
        setTotalExpenses(0);
        setMonthlyData([]);
        setIncomeCategories([]);
        setExpenseCategories([]);
      }
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate values from state
  const netCashFlow = totalIncome - totalExpenses;
  const cashFlowStatus = netCashFlow >= 0 ? "Positive" : "Negative";

  // Calculate MoM changes
  const previousMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  const moMIncomeChange = previousMonthData?.income ? ((totalIncome - previousMonthData.income) / previousMonthData.income) * 100 : 0;
  const moMExpenseChange = previousMonthData?.expense ? ((totalExpenses - previousMonthData.expense) / previousMonthData.expense) * 100 : 0;
  const moMNetFlowChange = previousMonthData ? (netCashFlow - previousMonthData.netFlow) : 0;
  const scenarioMonthlyNet = forecast
    ? forecast.projectedNetFlow + scenario.monthlyIncomeChange - scenario.monthlyExpenseChange - scenario.extraDebtPayment
    : 0;
  const scenarioProjectedCash = forecast
    ? forecast.projectedCash + (scenario.monthlyIncomeChange - scenario.monthlyExpenseChange - scenario.extraDebtPayment) * 3 - scenario.oneTimePurchase
    : 0;
  const scenarioDelta = forecast ? scenarioProjectedCash - forecast.projectedCash : 0;


  return (
    <Layout userName={userName}>
      <SEO
        title="Cash Flow Analysis"
        description="Analyze your cash flow with detailed income vs. expenses tracking. Visualize monthly trends, identify cash flow patterns, and maintain positive cash flow."
        keywords="cash flow, cash flow analysis, income vs expenses, cash flow tracking, monthly cash flow, cash flow management, financial flow"
        canonical="/cash-flow"
      />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Cash Flow</h2>
          <p className="text-muted-foreground">
            {selectedMonth ? `${[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ][selectedMonth - 1]} ${selectedYear}` : `Full Year ${selectedYear}`}
          </p>
        </div>

        {forecast && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className={forecast.lowCashRisk ? "border-destructive/30" : ""}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">90-Day Projected Cash</p>
                <p className={`text-2xl font-bold ${forecast.projectedCash >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {formatTHB(forecast.projectedCash)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">After average spending and unpaid bills</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Monthly Run Rate</p>
                <p className="text-2xl font-bold">{formatTHB(forecast.averageMonthlyExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on recent expense behavior</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Cash Runway</p>
                <p className="text-2xl font-bold">
                  {forecast.runwayMonths === null ? "N/A" : `${forecast.runwayMonths.toFixed(1)} mo`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Current cash divided by monthly expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Forecast Status</p>
                <p className={`text-2xl font-bold ${forecast.lowCashRisk ? "text-destructive" : "text-success"}`}>
                  {forecast.lowCashRisk ? "Watch Cash" : "On Track"}
                </p>
                <Badge variant={forecast.lowCashRisk ? "destructive" : "default"} className="mt-1">
                  {formatTHB(forecast.projectedNetFlow)} monthly net
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {forecast && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Cash Flow Simulator</CardTitle>
              <CardDescription>
                Test a purchase, income change, expense change, or extra debt payment without changing your real data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="one-time-purchase">One-time purchase</Label>
                  <Input
                    id="one-time-purchase"
                    type="number"
                    min="0"
                    value={scenario.oneTimePurchase || ""}
                    onChange={(event) => setScenario((current) => ({ ...current, oneTimePurchase: Number(event.target.value || 0) }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-change">Monthly income change</Label>
                  <Input
                    id="income-change"
                    type="number"
                    value={scenario.monthlyIncomeChange || ""}
                    onChange={(event) => setScenario((current) => ({ ...current, monthlyIncomeChange: Number(event.target.value || 0) }))}
                    placeholder="e.g. -10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-change">Monthly expense increase</Label>
                  <Input
                    id="expense-change"
                    type="number"
                    value={scenario.monthlyExpenseChange || ""}
                    onChange={(event) => setScenario((current) => ({ ...current, monthlyExpenseChange: Number(event.target.value || 0) }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extra-debt-payment">Extra debt payment</Label>
                  <Input
                    id="extra-debt-payment"
                    type="number"
                    min="0"
                    value={scenario.extraDebtPayment || ""}
                    onChange={(event) => setScenario((current) => ({ ...current, extraDebtPayment: Number(event.target.value || 0) }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Scenario 90-day cash</p>
                  <p className={`text-2xl font-bold ${scenarioProjectedCash < 0 ? "text-destructive" : ""}`}>
                    {formatTHB(scenarioProjectedCash)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Monthly net under scenario</p>
                  <p className={`text-2xl font-bold ${scenarioMonthlyNet >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatTHB(scenarioMonthlyNet)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Impact vs baseline</p>
                  <p className={`text-2xl font-bold ${scenarioDelta >= 0 ? "text-success" : "text-destructive"}`}>
                    {scenarioDelta >= 0 ? "+" : ""}{formatTHB(scenarioDelta)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium">
                  {scenarioProjectedCash < forecast.averageMonthlyExpenses
                    ? "This scenario creates cash pressure"
                    : "This scenario looks manageable"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {scenarioProjectedCash < forecast.averageMonthlyExpenses
                    ? "Consider delaying the purchase, reducing expenses, or lowering extra debt payments until cash runway improves."
                    : "Projected cash remains above one month of recent expenses after this scenario."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                  <p className="text-2xl font-bold text-success">฿{totalIncome.toLocaleString()}</p>
                  {previousMonthData !== null && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium">
                      {moMIncomeChange > 0 ? (
                        <span className="text-success flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{moMIncomeChange.toFixed(1)}% vs last month
                        </span>
                      ) : moMIncomeChange < 0 ? (
                        <span className="text-destructive flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {moMIncomeChange.toFixed(1)}% vs last month
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0% vs last month</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <ArrowUpCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive">฿{totalExpenses.toLocaleString()}</p>
                  {previousMonthData !== null && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium">
                      {moMExpenseChange > 0 ? (
                        <span className="text-destructive flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{moMExpenseChange.toFixed(1)}% vs last month
                        </span>
                      ) : moMExpenseChange < 0 ? (
                        <span className="text-success flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {moMExpenseChange.toFixed(1)}% vs last month
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0% vs last month</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ArrowDownCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                    ฿{netCashFlow.toLocaleString()}
                  </p>
                  {previousMonthData !== null && (
                    <div className="flex items-center gap-1 mt-1 text-xs font-medium">
                      {moMNetFlowChange > 0 ? (
                        <span className="text-success flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +฿{moMNetFlowChange.toLocaleString()} vs last month
                        </span>
                      ) : moMNetFlowChange < 0 ? (
                        <span className="text-destructive flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          -฿{Math.abs(moMNetFlowChange).toLocaleString()} vs last month
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No change vs last month</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${netCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                  {netCashFlow >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-success" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cash Flow Status</p>
                  <p className="text-2xl font-bold">{cashFlowStatus}</p>
                  <Badge variant={netCashFlow >= 0 ? "default" : "destructive"} className="mt-1">
                    {totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(1) : '0.0'}% savings rate
                  </Badge>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${netCashFlow >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
                  <Activity className={`h-6 w-6 ${netCashFlow >= 0 ? "text-primary" : "text-destructive"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income vs Expense Bar Chart (12 months) */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>
                {selectedMonth ? 'Trend leading up to selection' : `Monthly performance for ${selectedYear}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--success)" name="Income" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--destructive)" name="Expenses" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="netFlow" stroke="var(--primary)" strokeWidth={2} name="Net Cash Flow" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow by Category (Pie Charts) */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Income by Category</CardTitle>
              <CardDescription>Breakdown of your income sources</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${((entry.value / incomeCategories.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(0)}%`}
                    labelLine
                  >
                    {incomeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {incomeCategories.map((cat) => (
                  <div key={cat.name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      {cat.name}
                    </span>
                    <span className="font-semibold">฿{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Breakdown of your spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${((entry.value / expenseCategories.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(0)}%`}
                    labelLine
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {expenseCategories.map((cat) => (
                  <div key={cat.name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      {cat.name}
                    </span>
                    <span className="font-semibold">฿{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CashFlow;
