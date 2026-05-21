import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Building2, Target, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SEO from "@/components/SEO";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Link } from "react-router-dom";
import { buildDebtPayoffPlan, DebtAccount, DebtPlanItem, formatTHB, summarizeDebtPlan } from "@/utils/planning";
import { getProfileDisplayName } from "@/services/profile-service";
import { getLiabilitySummary } from "@/services/financial-overview-service";

interface LiabilityCategory {
  name: string;
  icon: LucideIcon;
  total: number;
  items: number;
  path: string;
}

type LegendEntry = { payload?: { value?: number } };

const COLORS = ["#dc2626", "#f59e0b"];

const Liabilities = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [liabilityCategories, setLiabilityCategories] = useState<LiabilityCategory[]>([]);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [extraPayment, setExtraPayment] = useState(0);
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [debtAccounts, setDebtAccounts] = useState<DebtAccount[]>([]);
  const [debtPlan, setDebtPlan] = useState<DebtPlanItem[]>([]);

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
        fetchLiabilities(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const fullName = await getProfileDisplayName(userId);
    setUserName(fullName || "User");
  };

  const fetchLiabilities = async (userId: string) => {
    try {
      const summary = await getLiabilitySummary(userId, "active");
      const creditCardsTotal = summary.totalCreditCards;
      const loansTotal = summary.totalLoans;

      const categories: LiabilityCategory[] = [
        { name: "Credit Cards", icon: CreditCard, total: creditCardsTotal, items: summary.creditCards.length, path: "/liabilities/credit-cards" },
        { name: "Loans", icon: Building2, total: loansTotal, items: summary.loans.length, path: "/liabilities/loans" },
      ];

      setLiabilityCategories(categories);
      setTotalLiabilities(summary.totalLiabilities);
      const accounts: DebtAccount[] = [
        ...summary.creditCards.map((card) => ({
          id: card.id,
          name: `${card.issuer}${card.last_four_digits ? ` ****${card.last_four_digits}` : ""}`,
          balance: Number(card.current_balance || 0),
          interestRate: Number(card.interest_rate || 0),
          minimumPayment: Number(card.minimum_payment || 0),
          type: "credit_card" as const,
        })),
        ...summary.loans.map((loan) => ({
          id: loan.id,
          name: loan.lender,
          balance: Number(loan.current_balance || 0),
          interestRate: Number(loan.interest_rate || 0),
          minimumPayment: Number(loan.monthly_payment || 0),
          type: "loan" as const,
        })),
      ];
      setDebtAccounts(accounts);
      setDebtPlan(buildDebtPayoffPlan(accounts, extraPayment, strategy));
    } catch (error) {
      console.error("Error fetching liabilities:", error);
    }
  };

  useEffect(() => {
    setDebtPlan(buildDebtPayoffPlan(debtAccounts, extraPayment, strategy));
  }, [debtAccounts, extraPayment, strategy]);

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

  const chartData = liabilityCategories
    .filter(cat => cat.total > 0)
    .map(cat => ({
      name: cat.name,
      value: cat.total,
    }));

  const prioritizedDebt = debtPlan[0];
  const totalMinimumPayments = debtPlan.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const avalancheSummary = summarizeDebtPlan(buildDebtPayoffPlan(debtAccounts, extraPayment, "avalanche"));
  const snowballSummary = summarizeDebtPlan(buildDebtPayoffPlan(debtAccounts, extraPayment, "snowball"));
  const selectedSummary = summarizeDebtPlan(debtPlan);
  const interestDifference = snowballSummary.estimatedInterest - avalancheSummary.estimatedInterest;

  return (
    <Layout userName={userName}>
      <SEO
        title="Liabilities Management"
        description="Track and manage all your liabilities including credit cards, loans, and other debts. Monitor your total liability and debt distribution."
        keywords="liability tracking, debt management, credit cards, loans, debt tracking, financial obligations"
        canonical="/liabilities"
      />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Liabilities</h2>
            <p className="text-muted-foreground">Track and manage your liabilities</p>
          </div>
        </div>

        {/* Total Liabilities Card */}
        <Card className="mb-8 shadow-md border-destructive/20">
          <CardHeader>
            <CardTitle className="text-2xl">Total Liabilities</CardTitle>
            <CardDescription>Your total liabilities across all categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive">
              ฿{totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Liability Categories Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-8">
          {liabilityCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.name} to={category.path}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-destructive/10 hover:border-destructive/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category.name}
                    </CardTitle>
                    <Icon className="h-5 w-5 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      ฿{category.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.items} {category.items === 1 ? 'item' : 'items'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {debtPlan.length > 0 && (
          <Card className="mb-8 shadow-md">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Debt Payoff Planner
                  </CardTitle>
                  <CardDescription>
                    Compare payoff methods, estimate interest, and choose where extra payments should go first.
                  </CardDescription>
                </div>
                <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="debt-strategy">Strategy</Label>
                    <Select value={strategy} onValueChange={(value) => setStrategy(value as "avalanche" | "snowball")}>
                      <SelectTrigger id="debt-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avalanche">Avalanche</SelectItem>
                        <SelectItem value="snowball">Snowball</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="extra-payment">Extra monthly payment</Label>
                    <Input
                      id="extra-payment"
                      type="number"
                      min="0"
                      value={extraPayment}
                      onChange={(event) => setExtraPayment(Math.max(0, Number(event.target.value || 0)))}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Estimated Interest</p>
                  <p className="text-2xl font-bold">{formatTHB(selectedSummary.estimatedInterest)}</p>
                  <p className="text-xs text-muted-foreground">Based on current payment assumptions</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Longest Payoff</p>
                  <p className="text-2xl font-bold">
                    {selectedSummary.longestPayoffMonths ? `${selectedSummary.longestPayoffMonths} mo` : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">For debts with enough payment to amortize</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Avalanche Advantage</p>
                  <p className={`text-2xl font-bold ${interestDifference > 0 ? "text-success" : ""}`}>
                    {interestDifference > 0 ? formatTHB(interestDifference) : "Similar"}
                  </p>
                  <p className="text-xs text-muted-foreground">Potential interest saved vs snowball</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={`rounded-lg border p-4 ${strategy === "avalanche" ? "border-primary bg-primary/5" : ""}`}>
                  <p className="font-semibold">Avalanche</p>
                  <p className="text-sm text-muted-foreground">Highest interest first. Usually saves the most money.</p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>Interest estimate</span>
                    <span className="font-medium">{formatTHB(avalancheSummary.estimatedInterest)}</span>
                  </div>
                </div>
                <div className={`rounded-lg border p-4 ${strategy === "snowball" ? "border-primary bg-primary/5" : ""}`}>
                  <p className="font-semibold">Snowball</p>
                  <p className="text-sm text-muted-foreground">Smallest balance first. Builds motivation faster.</p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>Interest estimate</span>
                    <span className="font-medium">{formatTHB(snowballSummary.estimatedInterest)}</span>
                  </div>
                </div>
              </div>

              {prioritizedDebt && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pay this first</p>
                      <h3 className="text-xl font-semibold">{prioritizedDebt.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {prioritizedDebt.interestRate.toFixed(2)}% APR, about {formatTHB(prioritizedDebt.monthlyInterest)} interest this month
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-muted-foreground">Minimum payments</p>
                      <p className="text-2xl font-bold">{formatTHB(totalMinimumPayments + extraPayment)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {debtPlan.map((debt) => (
                  <div key={debt.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Priority #{debt.priority}</p>
                        <h3 className="font-semibold">{debt.name}</h3>
                      </div>
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance</span>
                        <span className="font-medium">{formatTHB(debt.balance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate</span>
                        <span className="font-medium">{debt.interestRate.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. payoff</span>
                        <span className="font-medium">{debt.payoffDate || "Increase payment"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. interest</span>
                        <span className="font-medium">{debt.totalInterest === null ? "N/A" : formatTHB(debt.totalInterest)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liability Breakdown Chart */}
        {chartData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Liability Breakdown</CardTitle>
              <CardDescription>Distribution of your liabilities across categories</CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden p-0">
              <div className="w-full h-[320px] min-h-[280px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: '10px',
                        fontSize: '12px',
                      }}
                      formatter={(value: string, entry: LegendEntry) => {
                        const percent = totalLiabilities > 0 ? (((entry.payload?.value || 0) / totalLiabilities) * 100).toFixed(0) : "0";
                        return `${value} (${percent}%)`;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value: number) => [
                        `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        'Amount'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {chartData.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Liabilities Yet</CardTitle>
              <CardDescription>Start tracking your liabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No liabilities recorded yet. Click on any category above to add your first liability.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Liabilities;
