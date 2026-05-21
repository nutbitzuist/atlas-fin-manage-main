import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Mail, TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3, Calendar } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import type { jsPDF as JsPDFDocument } from "jspdf";
import { getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

interface Transaction {
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
}

interface AutoTableDocument extends JsPDFDocument {
  lastAutoTable?: {
    finalY: number;
  };
}

export default function ReportsAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);

  // Transaction data from database
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      fetchTransactionData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedMonth, selectedYear, selectedQuarter, reportType]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setSession(session);

      // Fetch user profile
      setUserName(await getProfileDisplayName(session.user.id));

      // Fetch transactions
      await fetchTransactionData();
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Determine date range based on report type
      const { startDate, endDate } = getDateRange();

      const data = await getTransactionsByUserId(
        session.user.id,
        {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          orderBy: "transaction_date",
          ascending: false,
        },
        "*"
      );

      if (!data) {
        setTransactions([]);
        return;
      }

      if (data) {
        const formattedTransactions: Transaction[] = data.map(t => ({
          date: t.transaction_date,
          type: t.type as "income" | "expense",
          category: t.category || "Other",
          amount: Number(t.amount),
          description: t.description || t.merchant || ""
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error("Error in fetchTransactionData:", error);
    }
  };

  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (reportType === "monthly") {
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate = new Date(selectedYear, selectedMonth + 1, 0);
    } else if (reportType === "quarterly") {
      const quarterStartMonth = (selectedQuarter - 1) * 3;
      startDate = new Date(selectedYear, quarterStartMonth, 1);
      endDate = new Date(selectedYear, quarterStartMonth + 3, 0);
    } else if (reportType === "annual") {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
    } else { // analytics - last 6 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      endDate = now;
    }

    return { startDate, endDate };
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month, 1).toLocaleString('default', { month: 'long' });
  };

  const getQuarterMonths = (quarter: number) => {
    const quarters: { [key: number]: string } = {
      1: "Jan - Mar",
      2: "Apr - Jun",
      3: "Jul - Sep",
      4: "Oct - Dec"
    };
    return quarters[quarter];
  };

  const getReportTitle = () => {
    if (reportType === "monthly") {
      return `${getMonthName(selectedMonth)} ${selectedYear} Financial Report`;
    } else if (reportType === "quarterly") {
      return `Q${selectedQuarter} ${selectedYear} Financial Report`;
    } else if (reportType === "annual") {
      return `${selectedYear} Annual Financial Report`;
    } else {
      return `${selectedYear} Tax Summary`;
    }
  };

  const calculateSummary = () => {
    const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    return { totalIncome, totalExpenses, netIncome, savingsRate };
  };

  const getCategoryBreakdown = () => {
    const categoryTotals: { [key: string]: number } = {};

    transactions.filter(t => t.type === "expense").forEach(t => {
      if (categoryTotals[t.category]) {
        categoryTotals[t.category] += t.amount;
      } else {
        categoryTotals[t.category] = t.amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getTopMerchants = () => {
    const merchantTotals: { [key: string]: { amount: number; count: number } } = {};

    transactions
      .filter(t => t.type === "expense" && t.description)
      .forEach(t => {
        const merchant = t.description;
        if (!merchantTotals[merchant]) {
          merchantTotals[merchant] = { amount: 0, count: 0 };
        }
        merchantTotals[merchant].amount += t.amount;
        merchantTotals[merchant].count += 1;
      });

    return Object.entries(merchantTotals)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        transactions: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const getSpendingByDayOfWeek = () => {
    const dayTotals: { [key: string]: number } = {
      "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0
    };

    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const date = new Date(t.date);
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
        dayTotals[dayName] += t.amount;
      });

    return [
      { day: "Mon", amount: dayTotals["Mon"] },
      { day: "Tue", amount: dayTotals["Tue"] },
      { day: "Wed", amount: dayTotals["Wed"] },
      { day: "Thu", amount: dayTotals["Thu"] },
      { day: "Fri", amount: dayTotals["Fri"] },
      { day: "Sat", amount: dayTotals["Sat"] },
      { day: "Sun", amount: dayTotals["Sun"] }
    ];
  };

  const getIncomeSourcesData = () => {
    const incomeTotals: { [key: string]: number } = {};

    transactions
      .filter(t => t.type === "income")
      .forEach(t => {
        const category = t.category || "Other";
        incomeTotals[category] = (incomeTotals[category] || 0) + t.amount;
      });

    return Object.entries(incomeTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getIncomeTrend = () => {
    const monthlyIncome: { [key: string]: number } = {};

    transactions
      .filter(t => t.type === "income")
      .forEach(t => {
        const date = new Date(t.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + t.amount;
      });

    // Sort by date and return last 6 months
    return Object.entries(monthlyIncome)
      .map(([month, income]) => ({ month: month.split(' ')[0], income }))
      .slice(-6);
  };

  const handleDownloadPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF();
      const summary = calculateSummary();
      const categoryBreakdown = getCategoryBreakdown();

      // Title
      doc.setFontSize(20);
      doc.text(getReportTitle(), 14, 22);

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      // Summary section
      doc.setFontSize(14);
      doc.text("Financial Summary", 14, 45);

      const summaryData = [
        ["Total Income", `฿${summary.totalIncome.toLocaleString()}`],
        ["Total Expenses", `฿${summary.totalExpenses.toLocaleString()}`],
        ["Net Income", `฿${summary.netIncome.toLocaleString()}`],
        ["Savings Rate", `${summary.savingsRate.toFixed(1)}%`]
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
      });

      // Category breakdown
      if (categoryBreakdown.length > 0) {
        const finalY = (doc as AutoTableDocument).lastAutoTable?.finalY || 50;
        doc.setFontSize(14);
        doc.text("Expense Breakdown by Category", 14, finalY + 15);

        const categoryData = categoryBreakdown.map(cat => [
          cat.name,
          `฿${cat.value.toLocaleString()}`,
          `${((cat.value / summary.totalExpenses) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
          startY: finalY + 20,
          head: [['Category', 'Amount', '% of Total']],
          body: categoryData,
          theme: 'grid',
        });
      }

      // Save the PDF
      doc.save(`financial_report_${new Date().toISOString().split('T')[0]}.pdf`);

      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleExportCSV = () => {
    try {
      const summary = calculateSummary();
      const categoryBreakdown = getCategoryBreakdown();

      // Create CSV content
      let csvContent = `${getReportTitle()}\n`;
      csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;

      // Summary section
      csvContent += "Financial Summary\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Income,${summary.totalIncome}\n`;
      csvContent += `Total Expenses,${summary.totalExpenses}\n`;
      csvContent += `Net Income,${summary.netIncome}\n`;
      csvContent += `Savings Rate,${summary.savingsRate.toFixed(1)}%\n\n`;

      // Category breakdown
      csvContent += "Expense Breakdown by Category\n";
      csvContent += "Category,Amount,% of Total\n";
      categoryBreakdown.forEach(cat => {
        const percentage = ((cat.value / summary.totalExpenses) * 100).toFixed(1);
        csvContent += `${cat.name},${cat.value},${percentage}%\n`;
      });

      // Transactions
      csvContent += "\nTransactions\n";
      csvContent += "Date,Type,Category,Amount,Description\n";
      transactions.forEach(t => {
        csvContent += `${t.date},${t.type},${t.category},${t.amount},${t.description}\n`;
      });

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV file exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV file");
    }
  };

  const handleEmailReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("No email address found");
        return;
      }

      const summary = calculateSummary();

      // Create email body
      const emailBody = `
Financial Report: ${getReportTitle()}
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
- Total Income: ฿${summary.totalIncome.toLocaleString()}
- Total Expenses: ฿${summary.totalExpenses.toLocaleString()}
- Net Income: ฿${summary.netIncome.toLocaleString()}
- Savings Rate: ${summary.savingsRate.toFixed(1)}%

This report has been automatically generated from your Atlas Financial Manager account.
      `.trim();

      // Create mailto link
      const subject = encodeURIComponent(getReportTitle());
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:${user.email}?subject=${subject}&body=${body}`;

      // Open mail client
      window.location.href = mailtoLink;

      toast.success(`Opening email client to send report to ${user.email}`);
    } catch (error) {
      console.error("Error preparing email:", error);
      toast.error("Failed to prepare email report");
    }
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

  const summary = calculateSummary();
  const categoryBreakdown = getCategoryBreakdown();
  const topMerchants = getTopMerchants();
  const spendingByDay = getSpendingByDayOfWeek();
  const incomeSources = getIncomeSourcesData();
  const incomeTrend = getIncomeTrend();

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive financial reports and insights</p>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {getReportTitle()}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Complete financial overview for the selected period
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {getMonthName(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2022, 2023, 2024, 2025].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold text-success mt-1">฿{summary.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive mt-1">฿{summary.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p className={`text-2xl font-bold mt-1 ${summary.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ฿{summary.netIncome.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-2xl font-bold mt-1">{summary.savingsRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">Expense Breakdown by Category</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryBreakdown.map((cat) => (
                      <TableRow key={cat.name}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell className="text-right font-medium">฿{cat.value.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {((cat.value / summary.totalExpenses) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={handleEmailReport} variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Report */}
        <TabsContent value="quarterly" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {getReportTitle()}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {getQuarterMonths(selectedQuarter)} financial summary
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(q => (
                        <SelectItem key={q} value={q.toString()}>
                          Q{q} - {getQuarterMonths(q)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2022, 2023, 2024, 2025].map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Quarterly Income</p>
                  <p className="text-2xl font-bold text-success mt-1">฿{(summary.totalIncome * 3).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Quarterly Expenses</p>
                  <p className="text-2xl font-bold text-destructive mt-1">฿{(summary.totalExpenses * 3).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p className="text-2xl font-bold text-success mt-1">฿{(summary.netIncome * 3).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Monthly</p>
                  <p className="text-2xl font-bold mt-1">฿{summary.netIncome.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Annual Report */}
        <TabsContent value="annual" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {getReportTitle()}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Complete year-end financial summary
                  </CardDescription>
                </div>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2022, 2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Annual Income</p>
                  <p className="text-2xl font-bold text-success mt-1">฿{(summary.totalIncome * 12).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Annual Expenses</p>
                  <p className="text-2xl font-bold text-destructive mt-1">฿{(summary.totalExpenses * 12).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p className="text-2xl font-bold text-success mt-1">฿{(summary.netIncome * 12).toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Monthly</p>
                  <p className="text-2xl font-bold mt-1">฿{summary.netIncome.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Spending Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Spending Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryBreakdown.slice(0, 5)}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="value" fill="var(--destructive)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Merchants */}
            <Card>
              <CardHeader>
                <CardTitle>Top Merchants by Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMerchants.map((merchant) => (
                      <TableRow key={merchant.name}>
                        <TableCell>{merchant.name}</TableCell>
                        <TableCell className="text-right font-medium">฿{merchant.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{merchant.transactions}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Day of Week Spending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Spending by Day of Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendingByDay}>
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="var(--chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Income Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Income Sources Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Income Trend */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Income Trends Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incomeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => [`฿${Number(value).toLocaleString()}`, 'Income']}
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--chart-1)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}
