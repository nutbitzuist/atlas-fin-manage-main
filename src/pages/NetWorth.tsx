import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { getErrorMessage } from "@/utils/errors";
import { getProfileDisplayName } from "@/services/profile-service";
import { getAssetSummary, getLiabilitySummary } from "@/services/financial-overview-service";
import { getNetWorthHistoryByUser, upsertNetWorthSnapshot } from "@/services/net-worth-history-service";

const ASSET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
const LIABILITY_COLORS = ['#ef4444', '#f97316', '#f43f5e'];

interface AssetBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface LiabilityBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface NetWorthDataPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export default function NetWorth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("6M");

  // Real data states
  const [currentNetWorth, setCurrentNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [assetBreakdown, setAssetBreakdown] = useState<AssetBreakdown[]>([]);
  const [liabilityBreakdown, setLiabilityBreakdown] = useState<LiabilityBreakdown[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthDataPoint[]>([]);
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);

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

      setUserName(await getProfileDisplayName(session.user.id, "User"));

      // Fetch all financial data
      const [assetsTotal = 0, liabilitiesTotal = 0] = await Promise.all([
        fetchAssets(session.user.id),
        fetchLiabilities(session.user.id)
      ]);
      
      await fetchNetWorthHistory(session.user.id, assetsTotal, liabilitiesTotal);
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async (userId: string) => {
    try {
      const summary = await getAssetSummary(userId, "active");
      const breakdown: AssetBreakdown[] = summary.categoryBreakdown.filter((item) => item.amount > 0);

      setTotalAssets(summary.totalAssets);
      setAssetBreakdown(breakdown);
      return summary.totalAssets;
    } catch (error) {
      console.error("Error fetching assets:", error);
      return 0;
    }
  };

  const fetchLiabilities = async (userId: string) => {
    try {
      const summary = await getLiabilitySummary(userId, "active");
      const breakdown = summary.categoryBreakdown;

      setTotalLiabilities(summary.totalLiabilities);
      setLiabilityBreakdown(breakdown);
      return summary.totalLiabilities;
    } catch (error) {
      console.error("Error fetching liabilities:", error);
      return 0;
    }
  };

  const fetchNetWorthHistory = async (userId: string, currentAssets: number, currentLiabilities: number) => {
    try {
      // Auto-Snapshot Logic
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      await upsertNetWorthSnapshot(userId, {
        date: todayStr,
        totalAssets: currentAssets,
        totalLiabilities: currentLiabilities,
      });

      // Fetch history up to 12 months
      const data = await getNetWorthHistoryByUser(userId, {
        orderBy: "date",
        ascending: true,
        limit: 12,
      });

      if (data && data.length > 0) {
        const history = data.map(record => ({
          date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          assets: Number(record.total_assets || 0),
          liabilities: Number(record.total_liabilities || 0),
          netWorth: Number(record.net_worth || 0)
        }));
        setNetWorthHistory(history);
      } else {
        // No history yet, create current snapshot
        setNetWorthHistory([]);
      }
    } catch (error) {
      console.error("Error fetching net worth history:", error);
      setNetWorthHistory([]);
    }
  };

  // Calculate net worth whenever assets or liabilities change
  useEffect(() => {
    setCurrentNetWorth(totalAssets - totalLiabilities);
  }, [totalAssets, totalLiabilities]);

  const getFilteredHistory = () => {
    const ranges = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "ALL": netWorthHistory.length
    };

    const monthsToShow = ranges[timeRange];
    return netWorthHistory.slice(-monthsToShow);
  };

  const handleSaveSnapshot = async () => {
    try {
      setIsTakingSnapshot(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split("T")[0];
      const [assetsTotal, liabilitiesTotal] = await Promise.all([
        getAssetSummary(session.user.id, "active").then((summary) => summary.totalAssets),
        getLiabilitySummary(session.user.id, "active").then((summary) => summary.totalLiabilities),
      ]);

      await upsertNetWorthSnapshot(session.user.id, {
        date: today,
        totalAssets: assetsTotal,
        totalLiabilities: liabilitiesTotal,
      });
      
      toast.success("Net Worth snapshot saved successfully!");
      
      // Refresh historical data
      const [updatedAssetsTotal, updatedLiabilitiesTotal] = await Promise.all([
        fetchAssets(session.user.id),
        fetchLiabilities(session.user.id),
      ]);
      await fetchNetWorthHistory(session.user.id, updatedAssetsTotal, updatedLiabilitiesTotal);
      
    } catch (error: unknown) {
      console.error("Error saving snapshot:", error);
      toast.error(getErrorMessage(error, "Failed to save snapshot"));
    } finally {
      setIsTakingSnapshot(false);
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

  const filteredHistory = getFilteredHistory();

  // Calculate changes from history
  const getHistoryChanges = () => {
    if (netWorthHistory.length === 0) {
      return { lastMonthChange: 0, lastMonthPercent: 0, lastYearChange: 0, lastYearPercent: 0 };
    }

    const current = currentNetWorth;
    const lastMonth = netWorthHistory.length >= 2 ? netWorthHistory[netWorthHistory.length - 2]?.netWorth || current : current;
    const lastYear = netWorthHistory.length >= 12 ? netWorthHistory[netWorthHistory.length - 12]?.netWorth || current : netWorthHistory[0]?.netWorth || current;

    const lastMonthChange = current - lastMonth;
    const lastMonthPercent = lastMonth !== 0 ? (lastMonthChange / lastMonth) * 100 : 0;
    const lastYearChange = current - lastYear;
    const lastYearPercent = lastYear !== 0 ? (lastYearChange / lastYear) * 100 : 0;

    return { lastMonthChange, lastMonthPercent, lastYearChange, lastYearPercent };
  };

  const { lastMonthChange, lastMonthPercent, lastYearChange, lastYearPercent } = getHistoryChanges();

  return (
    <Layout userName={userName}>
      <SEO
        title="Net Worth Tracker"
        description="Track your net worth over time with detailed breakdowns of assets and liabilities. Monitor trends, set targets, and visualize your wealth growth with interactive charts."
        keywords="net worth calculator, wealth tracker, asset liability breakdown, financial growth, net worth trends"
        canonical="/net-worth"
      />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Net Worth Tracking</h1>
            <p className="text-muted-foreground mt-1">Monitor your financial growth over time</p>
          </div>
          <Button 
            className="flex items-center gap-2" 
            onClick={handleSaveSnapshot}
            disabled={isTakingSnapshot}
          >
            <TrendingUp className="h-4 w-4" />
            {isTakingSnapshot ? "Saving..." : "Save Monthly Snapshot"}
          </Button>
        </div>

        {/* Current Net Worth Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Net Worth</CardTitle>
            <CardDescription>Your total assets minus liabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center py-6">
                <p className="text-5xl font-bold text-primary">
                  ฿{currentNetWorth.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Since Last Month</p>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    {lastMonthChange >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <p className={`text-xl font-bold ${lastMonthChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {lastMonthChange >= 0 ? '+' : ''}฿{Math.abs(lastMonthChange).toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm ${lastMonthChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {lastMonthChange >= 0 ? '+' : ''}{lastMonthPercent.toFixed(2)}%
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Since Last Year</p>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    {lastYearChange >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <p className={`text-xl font-bold ${lastYearChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {lastYearChange >= 0 ? '+' : ''}฿{Math.abs(lastYearChange).toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm ${lastYearChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {lastYearChange >= 0 ? '+' : ''}{lastYearPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Assets Breakdown</CardTitle>
              <CardDescription>Total Assets: ฿{totalAssets.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category.split(' ')[0]}: ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {assetBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `฿${Number(value).toLocaleString()}`,
                      props.payload.category
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {assetBreakdown.map((asset, index) => (
                  <div key={asset.category} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ASSET_COLORS[index % ASSET_COLORS.length] }}
                      />
                      <span className="text-sm">{asset.category}</span>
                    </div>
                    <span className="text-sm font-medium">฿{asset.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liabilities Breakdown</CardTitle>
              <CardDescription>Total Liabilities: ฿{totalLiabilities.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={liabilityBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category.split(' ')[0]}: ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {liabilityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LIABILITY_COLORS[index % LIABILITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `฿${Number(value).toLocaleString()}`,
                      props.payload.category
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {liabilityBreakdown.map((liability, index) => (
                  <div key={liability.category} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: LIABILITY_COLORS[index % LIABILITY_COLORS.length] }}
                      />
                      <span className="text-sm">{liability.category}</span>
                    </div>
                    <span className="text-sm font-medium">฿{liability.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Worth Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Net Worth Trend</CardTitle>
                <CardDescription>Track your financial progress over time</CardDescription>
              </div>
              <div className="flex gap-2">
                {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={filteredHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `฿${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value) => [`฿${Number(value).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="assets"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--chart-1)' }}
                    name="Assets"
                  />
                  <Line
                    type="monotone"
                    dataKey="liabilities"
                    stroke="var(--destructive)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--destructive)' }}
                    name="Liabilities"
                  />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--primary)', r: 5 }}
                    name="Net Worth"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No Historical Data Yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start tracking your net worth to see trends over time
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Worth Goals (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Net Worth Goals
            </CardTitle>
            <CardDescription>Set and track your financial milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">Reach ฿10,000,000</h3>
                    <p className="text-sm text-muted-foreground">Target by December 2025</p>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">84.5%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '84.5%' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ฿1,550,000 remaining
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg opacity-60">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">Debt-Free Goal</h3>
                    <p className="text-sm text-muted-foreground">Target by December 2028</p>
                  </div>
                  <Badge variant="outline">Future</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">12.3%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '12.3%' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ฿3,550,000 remaining
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
