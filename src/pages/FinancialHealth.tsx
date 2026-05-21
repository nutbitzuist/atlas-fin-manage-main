import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, Shield, Wallet, CreditCard, PiggyBank, Download, Share2, EyeOff, LucideIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import SEO from "@/components/SEO";
import { getProfileById, getProfileDisplayName } from "@/services/profile-service";
import { getTransactionsByUserId } from "@/services/transaction-service";
import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";
import { getIncomeByUserId } from "@/services/income-service";
import { toLocalDateInput } from "@/utils/date";
import {
  createHealthHistoryEntry,
  getHealthHistoryByUser,
  getHealthHistoryByUserAndDate
} from "@/services/financial-health-history-service";

interface HealthMetric {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: LucideIcon;
  status: "excellent" | "good" | "fair" | "needs-improvement";
  description: string;
  reverse?: boolean; // For metrics where lower is better
}

interface ScoreHistory {
  month: string;
  score: number;
}

const readStoredCompletedActions = (): string[] => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const raw = localStorage.getItem("atlas_health_completed_actions");
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function FinancialHealth() {
  const navigate = useNavigate();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [completedActions, setCompletedActions] = useState<string[]>(readStoredCompletedActions);
  const [hideShareDetails, setHideShareDetails] = useState(true);

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

      const [profile, profileDisplayName] = await Promise.all([
        getProfileById(session.user.id),
        getProfileDisplayName(session.user.id, "User"),
      ]);

      setUserName(profileDisplayName);

      // Calculate metrics
      await calculateFinancialHealth(session.user.id, profile);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialHealth = async (userId: string, profileData: {
    emergency_fund_target_months: number | null;
    emergency_fund_current_amount: number | null;
    monthly_investment_target: number | null;
  } | null) => {
    try {
      // Fetch all required data in parallel
      const [assetSummary, liabilitySummary, transactionsData, incomeData] = await Promise.all([
        getAssetSummary(userId, "active"),
        getLiabilitySummary(userId, "active"),
        getTransactionsByUserId(userId, {}, "*"),
        getIncomeByUserId(userId, {
          activeOnly: true,
        })
      ]);

      // 1. Emergency Fund (Strict sync with settings)
      const emergencyFundAmount = profileData?.emergency_fund_current_amount || 0;
      const emergencyFundTargetMonths = profileData?.emergency_fund_target_months || 6;
      const totalCashBalance = Number(assetSummary.totalCash || 0);

      // Calculate credit card utilization
      const totalCreditLimit = liabilitySummary.creditCards.reduce((sum, cc) => sum + Number(cc.credit_limit || 0), 0);
      const totalCreditBalance = Number(liabilitySummary.totalCreditCards || 0);
      const creditUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;

      // Calculate monthly debt payments
      const monthlyDebtPayments = [
        ...liabilitySummary.creditCards.map(cc => Number(cc.minimum_payment || 0)),
        ...liabilitySummary.loans.map(loan => Number(loan.monthly_payment || 0))
      ].reduce((sum, payment) => sum + payment, 0);

      // Calculate monthly income from multiple sources
      const now = new Date();

      // Calculate monthly income from income table (recurring income)
      const estimatedMonthlyIncome = (incomeData || []).reduce((sum, inc) => {
        if (!inc) return sum;
        const amount = Number(inc.amount || 0);
        const frequency = (inc.frequency || "monthly").toLowerCase();
        if (frequency === "yearly" || frequency === "annually") return sum + (amount / 12);
        if (frequency === "quarterly") return sum + (amount / 3);
        if (frequency === "weekly") return sum + (amount * 4.33);
        return sum + amount; // monthly
      }, 0);

      // Get last 3 months of transactions for better averaging
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const recentTransactions = (transactionsData || []).filter(t => new Date(t.transaction_date) >= threeMonthsAgo);

      // Calculate average monthly expenses from last 3 months
      const totalExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const monthsOfData = Math.max(1, Math.min(3, Math.ceil((now.getTime() - threeMonthsAgo.getTime()) / (30 * 24 * 60 * 60 * 1000))));
      const averageMonthlyExpenses = totalExpenses / monthsOfData;

      // Calculate actual investment from transactions this month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyInvested = (transactionsData || [])
        .filter(t => new Date(t.transaction_date) >= startOfMonth && (t.category === 'Investment' || t.category === 'Savings' && t.type === 'transfer'))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyInvestmentTarget = profileData?.monthly_investment_target || 0;

      // Data availability flags
      const hasIncomeData = estimatedMonthlyIncome > 0;
      const hasExpenseData = recentTransactions.filter(t => t.type === 'expense').length > 0;
      const hasDebtData = monthlyDebtPayments > 0 || totalCreditBalance > 0;

      // Calculate metrics with fallbacks
      const debtToIncomeRatio = hasIncomeData ? (monthlyDebtPayments / estimatedMonthlyIncome) * 100 : -1;
      const savingsRate = hasIncomeData && hasExpenseData ? ((estimatedMonthlyIncome - averageMonthlyExpenses) / estimatedMonthlyIncome) * 100 : -1;
      const emergencyFundMonths = hasExpenseData && averageMonthlyExpenses > 0 ? emergencyFundAmount / averageMonthlyExpenses : -1;

      // Determine status for each metric
      const getStatus = (current: number, target: number, reverse = false): "excellent" | "good" | "fair" | "needs-improvement" => {
        if (current < 0) return "needs-improvement"; // No data available
        const ratio = reverse ? target / (current + 0.01) : current / target;
        if (ratio >= 1) return "excellent";
        if (ratio >= 0.75) return "good";
        if (ratio >= 0.5) return "fair";
        return "needs-improvement";
      };

      const calculatedMetrics: HealthMetric[] = [
        {
          id: "debt_to_income",
          title: "Debt-to-Income Ratio",
          current: debtToIncomeRatio >= 0 ? debtToIncomeRatio : 0,
          target: 36,
          unit: "%",
          icon: CreditCard,
          status: getStatus(debtToIncomeRatio, 36, true),
          description: debtToIncomeRatio >= 0
            ? "Monthly debt payments divided by monthly income"
            : "Add income data to calculate (Income page or Transactions)",
          reverse: true
        },
        {
          id: "savings_rate",
          title: "Savings Rate",
          current: savingsRate >= 0 ? savingsRate : 0,
          target: 20,
          unit: "%",
          icon: PiggyBank,
          status: getStatus(savingsRate, 20),
          description: savingsRate >= 0
            ? "Percentage of income saved each month (3-month average)"
            : "Add income and expense transactions to calculate"
        },
        {
          id: "emergency_fund",
          title: "Emergency Fund Coverage",
          current: emergencyFundMonths >= 0 ? emergencyFundMonths : 0,
          target: emergencyFundTargetMonths,
          unit: "months",
          icon: Shield,
          status: getStatus(emergencyFundMonths, emergencyFundTargetMonths),
          description: emergencyFundMonths >= 0
            ? `Months of expenses covered (Target: ${emergencyFundTargetMonths} months)`
            : "Add expense transactions to calculate coverage"
        },
        {
          id: "credit_utilization",
          title: "Credit Utilization",
          current: creditUtilization,
          target: 30,
          unit: "%",
          icon: Wallet,
          status: getStatus(creditUtilization, 30, true),
          description: "Percentage of available credit being used",
          reverse: true
        },
        {
          id: "investment_rate",
          title: "Investment Progress",
          current: monthlyInvested,
          target: monthlyInvestmentTarget || (estimatedMonthlyIncome * 0.15), // Fallback to 15% of income if no target set
          unit: "฿",
          icon: TrendingUp,
          status: getStatus(monthlyInvested, monthlyInvestmentTarget || (estimatedMonthlyIncome * 0.15)),
          description: monthlyInvestmentTarget > 0 
            ? `Your actual investments vs your ฿${monthlyInvestmentTarget.toLocaleString()} goal`
            : "Set a monthly investment goal in Savings Goals to track accurately"
        },
        {
          id: "liquidity_ratio",
          title: "Liquidity Ratio",
          current: averageMonthlyExpenses > 0
            ? totalCashBalance / averageMonthlyExpenses
            : 0,
          target: 3,
          unit: "mo",
          icon: Wallet,
          status: getStatus(
            averageMonthlyExpenses > 0 ? totalCashBalance / averageMonthlyExpenses : 0,
            3
          ),
          description: "Total cash & bank balances divided by monthly expenses"
        }
      ];

      setMetrics(calculatedMetrics);

      // Calculate overall score (simple average of metric scores)
      const scores = calculatedMetrics.map(m => {
        if (m.status === "excellent") return 100;
        if (m.status === "good") return 75;
        if (m.status === "fair") return 50;
        return 25;
      });
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      setOverallScore(Math.round(avgScore));

      // Save current score to history (if not saved today) and fetch real history
      await saveAndFetchScoreHistory(userId, Math.round(avgScore), calculatedMetrics);
    } catch (error) {
      console.error("Error calculating financial health:", error);
    }
  };

  const saveAndFetchScoreHistory = async (userId: string, currentScore: number, currentMetrics: HealthMetric[]) => {
    try {
      const today = toLocalDateInput(new Date());

      const existing = await getHealthHistoryByUserAndDate(userId, today);

      // Save today's score if it doesn't exist
      if (!existing) {
        const savingsMetric = currentMetrics.find(m => m.title === "Savings Rate");
        const creditMetric = currentMetrics.find(m => m.title === "Credit Utilization");
        await createHealthHistoryEntry({
          user_id: userId,
          date: today,
          overall_score: currentScore,
          savings_rate: savingsMetric ? savingsMetric.current / 100 : null,
          credit_utilization: creditMetric ? creditMetric.current / 100 : null,
          updated_at: new Date().toISOString(),
        });
      }

      // Fetch real history (last 12 entries)
      const historyData = await getHealthHistoryByUser(userId, {
        ascending: true,
        limit: 12,
      });

      if (historyData && historyData.length > 0) {
        const history: ScoreHistory[] = historyData.map((h) => ({
          month: new Date(h.date).toLocaleDateString('en-US', { month: 'short' }),
          score: h.overall_score
        }));
        setScoreHistory(history);
      } else {
        // Only current score available
        setScoreHistory([{
          month: new Date().toLocaleDateString('en-US', { month: 'short' }),
          score: currentScore
        }]);
      }
    } catch (error) {
      console.warn("Error saving/fetching score history:", error);
      // Fallback: show just the current score
      setScoreHistory([{
        month: new Date().toLocaleDateString('en-US', { month: 'short' }),
        score: currentScore
      }]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) return "text-success";
    if (score >= 41) return "text-warning";
    return "text-destructive";
  };

  const getScoreStrokeColor = (score: number) => {
    if (score >= 71) return "#16a34a"; // success green
    if (score >= 41) return "#eab308"; // warning yellow
    return "#dc2626"; // destructive red
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 71) return "bg-success";
    if (score >= 41) return "bg-warning";
    return "bg-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 71) return "Excellent";
    if (score >= 41) return "Fair";
    return "Needs Improvement";
  };

  const getMetricStatus = (metric: HealthMetric) => {
    const percentage = metric.reverse
      ? ((metric.target - metric.current) / metric.target) * 100
      : (metric.current / metric.target) * 100;

    if (metric.status === "excellent") return { icon: CheckCircle, color: "text-success", bgColor: "bg-success/10", borderColor: "border-success/20" };
    if (metric.status === "good") return { icon: CheckCircle, color: "text-success", bgColor: "bg-success/10", borderColor: "border-success/20" };
    if (metric.status === "fair") return { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning/20" };
    return { icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive/20" };
  };

  const getRecommendations = () => {
    const recommendations: { priority: "high" | "medium" | "low"; title: string; description: string; impact: string }[] = [];

    metrics.forEach(metric => {
      if (metric.status === "needs-improvement" || metric.status === "fair") {
        if (metric.id === "debt_to_income") {
          recommendations.push({
            priority: "high",
            title: "Reduce Debt-to-Income Ratio",
            description: "Focus on paying off high-interest debt first. Consider the debt avalanche method or consolidation.",
            impact: "Could improve score by 5-8 points"
          });
        } else if (metric.id === "emergency_fund") {
          recommendations.push({
            priority: "high",
            title: "Build Emergency Fund",
            description: `Set up automatic transfers of ฿${Math.round((6 - metric.current) * 5000).toLocaleString()}/month to reach 6 months coverage`,
            impact: "Could improve score by 8-12 points"
          });
        } else if (metric.id === "savings_rate") {
          recommendations.push({
            priority: "medium",
            title: "Increase Savings Rate",
            description: "Review subscriptions, negotiate bills, and automate savings to reach 20% target",
            impact: "Could improve score by 3-5 points"
          });
        } else if (metric.id === "credit_utilization") {
          recommendations.push({
            priority: "medium",
            title: "Lower Credit Utilization",
            description: "Pay down credit cards or request higher limits to get below 30% utilization",
            impact: "Could improve score by 4-7 points"
          });
        } else if (metric.id === "investment_rate") {
          recommendations.push({
            priority: "medium",
            title: "Start Investing Consistently",
            description: "Set up automatic monthly investments in RMF/SSF funds for tax benefits and growth",
            impact: "Could improve score by 4-6 points"
          });
        } else if (metric.id === "liquidity_ratio") {
          recommendations.push({
            priority: "high",
            title: "Improve Cash Reserves",
            description: "Move some investments to a high-yield savings account for better liquidity",
            impact: "Could improve score by 5-8 points"
          });
        }
      }
    });

    // Always show at least 3 actionable recommendations
    if (recommendations.length < 3) {
      recommendations.push({
        priority: "low",
        title: "Diversify Income Streams",
        description: "Consider side income from consulting, investments, or passive income sources",
        impact: "Long-term score improvement"
      });
    }
    if (recommendations.length < 3) {
      recommendations.push({
        priority: "low",
        title: "Optimize Tax Efficiency",
        description: "Maximize RMF/SSF contributions to reduce taxes and build retirement savings",
        impact: "Immediate tax savings + future growth"
      });
    }
    if (recommendations.length < 3) {
      recommendations.push({
        priority: "low",
        title: "Review Insurance Coverage",
        description: "Ensure you have adequate health, life, and disability insurance protection",
        impact: "Risk protection & peace of mind"
      });
    }
    if (recommendations.length < 3) {
      recommendations.push({
        priority: "low",
        title: "Track All Expenses",
        description: "Record every expense to identify spending leaks and optimization opportunities",
        impact: "Better awareness leads to better decisions"
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, 5); // Return top 5 recommendations
  };

  const getActionLink = (title: string) => {
    if (title.includes("Debt") || title.includes("Credit")) return "/liabilities";
    if (title.includes("Emergency") || title.includes("Cash")) return "/settings/emergency-fund";
    if (title.includes("Savings") || title.includes("Investing") || title.includes("Tax")) return "/savings-goals";
    if (title.includes("Insurance")) return "/insurance";
    if (title.includes("Track")) return "/transactions";
    return "/financial-insights";
  };

  const getActionEffort = (priority: "high" | "medium" | "low") => {
    if (priority === "high") return { difficulty: "Medium", time: "20 min" };
    if (priority === "medium") return { difficulty: "Easy", time: "10 min" };
    return { difficulty: "Light", time: "5 min" };
  };

  const toggleActionCompleted = (title: string) => {
    const next = completedActions.includes(title)
      ? completedActions.filter((item) => item !== title)
      : [...completedActions, title];
    setCompletedActions(next);
    try {
      localStorage.setItem("atlas_health_completed_actions", JSON.stringify(next));
    } catch {
      // Ignore storage failures so the checklist still works in restricted browser modes.
    }
  };

  const shareCaption = overallScore >= 71
    ? "Financial habits are compounding."
    : overallScore >= 41
      ? "Building a stronger money system one step at a time."
      : "Starting the financial health journey with clarity.";

  const downloadShareCard = async () => {
    if (!shareCardRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(shareCardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = "atlas-financial-health-score.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyShareText = async () => {
    const visibleMetrics = metrics
      .slice(0, 3)
      .map(metric => `${metric.title}: ${metric.status.replace("-", " ")}`)
      .join(", ");
    const text = `My Atlas financial health score is ${overallScore}/100 (${getScoreLabel(overallScore)}). ${shareCaption}${hideShareDetails ? "" : ` Signals: ${visibleMetrics}.`}`;
    await navigator.clipboard.writeText(text);
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

  const recommendations = getRecommendations();
  const actionPlan = recommendations.slice(0, 3).map((rec) => ({
    ...rec,
    href: getActionLink(rec.title),
    ...getActionEffort(rec.priority),
    completed: completedActions.includes(rec.title),
  }));

  return (
    <Layout userName={userName}>
      <SEO
        title="Financial Health Dashboard"
        description="Comprehensive financial health assessment with key metrics including emergency fund, debt-to-income ratio, savings rate, and credit utilization. Get personalized recommendations."
        keywords="financial health, financial wellness, emergency fund, debt to income ratio, savings rate, credit score, financial metrics"
        canonical="/financial-health"
      />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Financial Health Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and improve your overall financial wellness</p>
        </div>

        {/* Overall Score Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Financial Health Score</CardTitle>
            <CardDescription>Your comprehensive financial wellness rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Gauge */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg className="w-48 h-48 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                    opacity="0.3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke={getScoreStrokeColor(overallScore)}
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(overallScore / 100) * 502.4} 502.4`}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dasharray 0.5s ease-in-out, stroke 0.3s ease-in-out'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${getScoreColor(overallScore)} transition-colors duration-300`}>
                    {overallScore}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">out of 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-6 py-3 rounded-lg ${getScoreBgColor(overallScore)}/20 border-2 ${getScoreBgColor(overallScore)}/40 shadow-sm flex items-center gap-2`}>
                    {overallScore >= 71 && <CheckCircle className="h-6 w-6 text-success" />}
                    {overallScore >= 41 && overallScore < 71 && <AlertCircle className="h-6 w-6 text-warning" />}
                    {overallScore < 41 && <AlertCircle className="h-6 w-6 text-destructive" />}
                    <span className={`font-bold text-xl ${getScoreColor(overallScore)}`}>
                      {getScoreLabel(overallScore)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-success shadow-sm" />
                    <span className="text-muted-foreground"><span className="font-semibold text-success">71-100:</span> Excellent</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-warning shadow-sm" />
                    <span className="text-muted-foreground"><span className="font-semibold text-warning">41-70:</span> Fair</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-destructive shadow-sm" />
                    <span className="text-muted-foreground"><span className="font-semibold text-destructive">0-40:</span> Needs Improvement</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground pt-2">
                  Your financial health score is calculated based on key metrics including debt-to-income ratio,
                  savings rate, emergency fund coverage, and credit utilization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shareable Score Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Shareable Financial Score Card
                </CardTitle>
                <CardDescription>
                  Create a privacy-safe card that hides exact amounts by default.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setHideShareDetails(!hideShareDetails)}>
                <EyeOff className="mr-2 h-4 w-4" />
                {hideShareDetails ? "Show metric signals" : "Hide metric signals"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div
              ref={shareCardRef}
              className="rounded-xl border bg-background p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Atlas Financial Health</p>
                  <p className={`mt-2 text-6xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</p>
                  <p className="mt-1 text-lg font-semibold">{getScoreLabel(overallScore)}</p>
                  <p className="mt-3 max-w-md text-sm text-muted-foreground">{shareCaption}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Privacy-safe</p>
                  <p className="mt-1 text-2xl font-bold">{hideShareDetails ? "Amounts hidden" : "Signals only"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">No balances or account names shown</p>
                </div>
              </div>

              {!hideShareDetails && (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {metrics.slice(0, 3).map((metric) => (
                    <div key={metric.id} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{metric.title}</p>
                      <p className="mt-1 text-sm font-semibold capitalize">{metric.status.replace("-", " ")}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <p className="text-xs text-muted-foreground">Built with Atlas Finance. This card is informational, not financial advice.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={downloadShareCard}>
                <Download className="mr-2 h-4 w-4" />
                Download image
              </Button>
              <Button variant="outline" className="w-full" onClick={copyShareText}>
                <Share2 className="mr-2 h-4 w-4" />
                Copy caption
              </Button>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Milestone caption</p>
                <p className="mt-1 text-sm text-muted-foreground">{shareCaption}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Improvement Action Plan */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Score Improvement Action Plan
            </CardTitle>
            <CardDescription>
              The top three actions most likely to improve your financial health score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Actions Complete</p>
                <p className="text-2xl font-bold">{actionPlan.filter((action) => action.completed).length} / {actionPlan.length}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Priority Mix</p>
                <p className="text-2xl font-bold">{actionPlan.filter((action) => action.priority === "high").length} high</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Score Target</p>
                <p className="text-2xl font-bold">+5 to +12</p>
              </div>
            </div>

            <div className="space-y-3">
              {actionPlan.map((action, index) => (
                <div key={action.title} className={`rounded-lg border p-4 ${action.completed ? "bg-success/10 border-success/20" : ""}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-semibold ${action.completed ? "line-through text-muted-foreground" : ""}`}>
                            {action.title}
                          </h3>
                          <Badge variant={action.priority === "high" ? "destructive" : action.priority === "medium" ? "default" : "secondary"}>
                            {action.priority}
                          </Badge>
                          <Badge variant="outline">{action.difficulty}</Badge>
                          <Badge variant="outline">{action.time}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                        <p className="mt-1 text-xs font-medium text-primary">{action.impact}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" onClick={() => navigate(action.href)}>
                        Open
                      </Button>
                      <Button variant={action.completed ? "secondary" : "default"} onClick={() => toggleActionCompleted(action.title)}>
                        {action.completed ? "Undo" : "Done"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Individual Metrics */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {metrics.map(metric => {
            const status = getMetricStatus(metric);
            const Icon = metric.icon;
            const StatusIcon = status.icon;
            const percentage = metric.reverse
              ? Math.max(0, Math.min(100, ((metric.target - metric.current) / metric.target) * 100))
              : Math.min(100, (metric.current / metric.target) * 100);

            return (
              <Card key={metric.id} className={`border-2 ${status.borderColor}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${status.bgColor}`}>
                        <Icon className={`h-5 w-5 ${status.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{metric.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">{metric.description}</CardDescription>
                      </div>
                    </div>
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {metric.current.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">{metric.unit}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        Target: {metric.target}{metric.unit}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Current Progress</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${status.bgColor}`}>
                      <p className={`text-sm font-medium ${status.color}`}>
                        {metric.status === "excellent" && "Excellent! You're exceeding the target."}
                        {metric.status === "good" && "Good progress! Keep it up."}
                        {metric.status === "fair" && "Fair. There's room for improvement."}
                        {metric.status === "needs-improvement" && "Needs attention to improve your score."}
                      </p>
                    </div>

                    {metric.id === "emergency_fund" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2 gap-2"
                        onClick={() => navigate("/settings/emergency-fund")}
                      >
                        <Shield className="h-4 w-4" />
                        Manage Emergency Fund
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Score History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Financial Health Score History
            </CardTitle>
            <CardDescription>Track your progress over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value} / 100`, 'Score']}
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--chart-1)', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className={`mt-4 p-3 rounded-lg border ${
              scoreHistory.length >= 2 && scoreHistory[scoreHistory.length - 1].score >= scoreHistory[0].score
                ? 'bg-success/10 border-success/20'
                : scoreHistory.length >= 2
                  ? 'bg-warning/10 border-warning/20'
                  : 'bg-muted/50 border-border'
            }`}>
              <p className={`text-sm font-medium ${
                scoreHistory.length >= 2 && scoreHistory[scoreHistory.length - 1].score >= scoreHistory[0].score
                  ? 'text-success'
                  : scoreHistory.length >= 2
                    ? 'text-warning'
                    : 'text-muted-foreground'
              }`}>
                {scoreHistory.length >= 2 ? (() => {
                  const change = scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score;
                  if (change > 0) return `📈 Your score has improved by ${change} points since tracking began!`;
                  if (change < 0) return `📉 Your score has decreased by ${Math.abs(change)} points. Review the recommendations below.`;
                  return `➡️ Your score has remained stable.`;
                })() : '📊 Keep checking back — your trend will appear after your next visit.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Actionable steps to improve your financial health score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${rec.priority === "high"
                    ? "bg-destructive/5 border-destructive"
                    : rec.priority === "medium"
                      ? "bg-warning/5 border-warning"
                      : "bg-muted/50 border-muted"
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{rec.title}</h3>
                        <Badge
                          variant={
                            rec.priority === "high"
                              ? "destructive"
                              : rec.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <p className="text-xs font-medium text-primary">{rec.impact}</p>
                    </div>
                  </div>
                </div>
              ))}

              {recommendations.length === 0 && (
                <div className="flex gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-success">Excellent Financial Health!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You're meeting or exceeding all key financial health metrics. Keep up the great work!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
