import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar, FileText, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getAssetSummary } from "@/services/financial-overview-service";
import { getNetWorthHistoryByUser } from "@/services/net-worth-history-service";
import { toLocalDateInput } from "@/utils/date";

type ReportPeriod = "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

interface IncomeStatementData {
  category: string;
  amount: number;
  percentage: number;
}

interface NetWorthData {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

interface AssetAllocationData {
  category: string;
  amount: number;
  percentage: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [period, setPeriod] = useState<ReportPeriod>("this_month");
  const [activeReport, setActiveReport] = useState<string>("income");

  // Report data
  const [incomeData, setIncomeData] = useState<IncomeStatementData[]>([]);
  const [expenseData, setExpenseData] = useState<IncomeStatementData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netWorthData, setNetWorthData] = useState<NetWorthData[]>([]);
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocationData[]>([]);

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
        generateReports(session.user.id, period);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (session?.user.id) {
      generateReports(session.user.id, period);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, session]);

  const fetchUserProfile = async (userId: string) => {
    setUserName(await getProfileDisplayName(userId));
  };

  const getDateRange = (period: ReportPeriod): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this_quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      }
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    return { startDate, endDate };
  };

  const generateReports = async (userId: string, reportPeriod: ReportPeriod) => {
    const { startDate, endDate } = getDateRange(reportPeriod);

      try {
      // Fetch transactions for income statement
      const transactions = await getTransactionsByUserId(
        userId,
        {
          startDate: toLocalDateInput(startDate),
          endDate: toLocalDateInput(endDate),
          orderBy: "transaction_date",
          ascending: false,
        },
      );

      if (transactions) {
        // Process income
        const incomeByCategory: Record<string, number> = {};
        const expenseByCategory: Record<string, number> = {};
        let income = 0;
        let expenses = 0;

        transactions.forEach(t => {
          if (t.type === 'income') {
            const category = t.category || 'Other';
            incomeByCategory[category] = (incomeByCategory[category] || 0) + Number(t.amount);
            income += Number(t.amount);
          } else if (t.type === 'expense') {
            const category = t.category || 'Other';
            expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(t.amount);
            expenses += Number(t.amount);
          }
        });

        setTotalIncome(income);
        setTotalExpenses(expenses);

        const incomeArray = Object.entries(incomeByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: income > 0 ? (amount / income) * 100 : 0
        }));

        const expenseArray = Object.entries(expenseByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0
        }));

        setIncomeData(incomeArray);
        setExpenseData(expenseArray);
      }

      // Fetch asset allocation
      const summary = await getAssetSummary(userId, "active");
      const allocation = summary.categoryBreakdown.filter((item) => item.amount > 0);
      setAssetAllocation(allocation);

      // Fetch net worth history
      const netWorthHistory = await getNetWorthHistoryByUser(userId, {
        startDate: toLocalDateInput(startDate),
        endDate: toLocalDateInput(endDate),
        orderBy: "date",
        ascending: true,
      });

      if (netWorthHistory && netWorthHistory.length > 0) {
        const history = netWorthHistory.map(record => ({
          date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          assets: Number(record.total_assets || 0),
          liabilities: Number(record.total_liabilities || 0),
          netWorth: Number(record.net_worth || 0)
        }));
        setNetWorthData(history);
      } else {
        setNetWorthData([]);
      }
    } catch (error) {
      console.error("Error generating reports:", error);
    }
  };

  const exportToCSV = (data: Record<string, string | number>[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/ /g, '_');
        return row[key] || '';
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${toLocalDateInput(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportIncomeStatement = () => {
    const data = [
      { section: 'INCOME', category: '', amount: '', percentage: '' },
      ...incomeData.map(item => ({
        section: '',
        category: item.category,
        amount: item.amount.toFixed(2),
        percentage: item.percentage.toFixed(2) + '%'
      })),
      { section: '', category: 'Total Income', amount: totalIncome.toFixed(2), percentage: '100%' },
      { section: '', category: '', amount: '', percentage: '' },
      { section: 'EXPENSES', category: '', amount: '', percentage: '' },
      ...expenseData.map(item => ({
        section: '',
        category: item.category,
        amount: item.amount.toFixed(2),
        percentage: item.percentage.toFixed(2) + '%'
      })),
      { section: '', category: 'Total Expenses', amount: totalExpenses.toFixed(2), percentage: '100%' },
      { section: '', category: '', amount: '', percentage: '' },
      { section: '', category: 'Net Income', amount: (totalIncome - totalExpenses).toFixed(2), percentage: '' },
    ];

    exportToCSV(data, 'income_statement', ['Section', 'Category', 'Amount', 'Percentage']);
  };

  const exportAssetAllocation = () => {
    const total = assetAllocation.reduce((sum, item) => sum + item.amount, 0);
    const data = assetAllocation.map(item => ({
      category: item.category,
      amount: item.amount.toFixed(2),
      percentage: item.percentage.toFixed(2) + '%'
    }));
    data.push({
      category: 'Total Assets',
      amount: total.toFixed(2),
      percentage: '100%'
    });

    exportToCSV(data, 'asset_allocation', ['Category', 'Amount', 'Percentage']);
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

  const getPeriodLabel = () => {
    switch (period) {
      case "this_month": return "This Month";
      case "last_month": return "Last Month";
      case "this_quarter": return "This Quarter";
      case "this_year": return "This Year";
      case "last_year": return "Last Year";
      default: return "This Month";
    }
  };

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h2>
            <p className="text-muted-foreground">Generate and export comprehensive financial reports</p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="income" value={activeReport} onValueChange={setActiveReport} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income">
              <FileText className="h-4 w-4 mr-2" />
              Income Statement
            </TabsTrigger>
            <TabsTrigger value="networth">
              <TrendingUp className="h-4 w-4 mr-2" />
              Net Worth
            </TabsTrigger>
            <TabsTrigger value="assets">
              <PieChart className="h-4 w-4 mr-2" />
              Asset Allocation
            </TabsTrigger>
          </TabsList>

          {/* Income Statement Report */}
          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Income Statement</CardTitle>
                    <CardDescription>Income and expenses for {getPeriodLabel()}</CardDescription>
                  </div>
                  <Button onClick={exportIncomeStatement} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Income Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-success">Income</h3>
                    {incomeData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">% of Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incomeData.map((item) => (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right">฿{item.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total Income</TableCell>
                            <TableCell className="text-right text-success">฿{totalIncome.toLocaleString()}</TableCell>
                            <TableCell className="text-right">100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-sm">No income recorded for this period</p>
                    )}
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-destructive">Expenses</h3>
                    {expenseData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">% of Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenseData.map((item) => (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right">฿{item.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total Expenses</TableCell>
                            <TableCell className="text-right text-destructive">฿{totalExpenses.toLocaleString()}</TableCell>
                            <TableCell className="text-right">100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-sm">No expenses recorded for this period</p>
                    )}
                  </div>

                  {/* Net Income */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">Net Income</h3>
                      <div className="flex items-center gap-3">
                        <Badge variant={totalIncome - totalExpenses >= 0 ? "default" : "destructive"} className="text-lg px-4 py-2">
                          {totalIncome - totalExpenses >= 0 ? '+' : ''}฿{(totalIncome - totalExpenses).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Net Worth Report */}
          <TabsContent value="networth" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Net Worth Report</CardTitle>
                    <CardDescription>Net worth changes for {getPeriodLabel()}</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      if (netWorthData.length > 0) {
                        exportToCSV(netWorthData, 'net_worth_report', ['Date', 'Assets', 'Liabilities', 'Net Worth']);
                      }
                    }}
                    variant="outline"
                    disabled={netWorthData.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {netWorthData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Assets</TableHead>
                        <TableHead className="text-right">Liabilities</TableHead>
                        <TableHead className="text-right">Net Worth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {netWorthData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell className="text-right text-success">฿{item.assets.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-destructive">฿{item.liabilities.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">฿{item.netWorth.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">No net worth history available for this period</p>
                    <p className="text-sm text-muted-foreground">Start tracking your net worth to see historical trends</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Asset Allocation Report */}
          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Asset Allocation</CardTitle>
                    <CardDescription>Current distribution of your assets</CardDescription>
                  </div>
                  <Button onClick={exportAssetAllocation} variant="outline" disabled={assetAllocation.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assetAllocation.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assetAllocation.map((item) => (
                          <TableRow key={item.category}>
                            <TableCell className="font-medium">{item.category}</TableCell>
                            <TableCell className="text-right">฿{item.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{item.percentage.toFixed(1)}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>Total Assets</TableCell>
                          <TableCell className="text-right text-primary">
                            ฿{assetAllocation.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">No assets found</p>
                    <p className="text-sm text-muted-foreground">Add assets to see your allocation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
