import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useYear } from "@/contexts/YearContext";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, RefreshCw, Eye, Target, TrendingUp, PieChart } from "lucide-react";
import { InvestmentDialog, Investment } from "@/components/assets/InvestmentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getProfileDisplayName } from "@/services/profile-service";
import { getErrorMessage } from "@/utils/errors";
import { deleteInvestmentById, getInvestmentsByUser } from "@/services/investment-service";
import { getTaxPlanningByUserAndYear } from "@/services/tax-planning-service";

// USD to THB exchange rate for MT4/MT5 account conversion
const USD_THB_RATE = 34.5;

const Investments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('finances');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const { selectedYear } = useYear();
  const currentYear = new Date().getFullYear();
  const [savedTaxDeductions, setSavedTaxDeductions] = useState<number | null>(null);
  const [mutualFundFilter, setMutualFundFilter] = useState<"all" | "RMF" | "LTF" | "Thai ESG" | "SSF" | "General">("all");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [defaultType, setDefaultType] = useState<string>("mutual_fund");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);

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
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const fullName = await getProfileDisplayName(userId);
    setUserName(fullName || "User");
  };

  const fetchInvestmentsAndTax = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [investmentsRes, taxRes] = await Promise.all([
        getInvestmentsByUser(user.id, {
          orderBy: "created_at",
          ascending: false,
        }),
        getTaxPlanningByUserAndYear(user.id, selectedYear),
      ]);

      setInvestments(investmentsRes || []);

      if (taxRes && taxRes.deductions?.rmf_ltf) {
        setSavedTaxDeductions(Number(taxRes.deductions.rmf_ltf));
      } else {
        setSavedTaxDeductions(null);
      }
    } catch (error: unknown) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "PGRST116")) {
        toast({
          title: "Error",
          description: "Failed to load investment data",
          variant: "destructive",
        });
      }
    }
  }, [selectedYear, toast]);

  useEffect(() => {
    if (session) {
      fetchInvestmentsAndTax();
    }
  }, [session, fetchInvestmentsAndTax]);

  const handleAddInvestment = (type: string) => {
    setDefaultType(type);
    setSelectedInvestment(null);
    setIsDialogOpen(true);
  };

  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (investmentId: string) => {
    setInvestmentToDelete(investmentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!investmentToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      await deleteInvestmentById(user.id, investmentToDelete);

      toast({
        title: "Success",
        description: "Investment deleted successfully",
      });

      fetchInvestmentsAndTax();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete investment"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setInvestmentToDelete(null);
    }
  };

  // Filter investments by type
  const mutualFunds = investments.filter(i => i.investment_type === "mutual_fund");
  const stocks = investments.filter(i => i.investment_type === "stock");
  const bonds = investments.filter(i => i.investment_type === "bond");
  const mt4Accounts = investments.filter(i => i.investment_type === "mt4_mt5");
  const businessInvestments = investments.filter(i => i.investment_type === "business");

  // MT4/MT5 totals in USD and THB
  const mt4TotalsUSD = {
    equity: mt4Accounts.reduce((sum, a) => sum + (a.equity || 0), 0),
    balance: mt4Accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
    profitLoss: mt4Accounts.reduce((sum, a) => sum + (a.profit_loss || 0), 0),
  };
  const mt4TotalsTHB = {
    equity: mt4TotalsUSD.equity * USD_THB_RATE,
    balance: mt4TotalsUSD.balance * USD_THB_RATE,
    profitLoss: mt4TotalsUSD.profitLoss * USD_THB_RATE,
  };

  // Calculate category totals for mutual funds
  const categoryTotals = {
    RMF: mutualFunds.filter(f => f.fund_category === "RMF").reduce((sum, f) => sum + ((f.units || 0) * (f.current_nav || 0)), 0),
    LTF: mutualFunds.filter(f => f.fund_category === "LTF").reduce((sum, f) => sum + ((f.units || 0) * (f.current_nav || 0)), 0),
    "Thai ESG": mutualFunds.filter(f => f.fund_category === "Thai ESG").reduce((sum, f) => sum + ((f.units || 0) * (f.current_nav || 0)), 0),
    SSF: mutualFunds.filter(f => f.fund_category === "SSF").reduce((sum, f) => sum + ((f.units || 0) * (f.current_nav || 0)), 0),
    General: mutualFunds.filter(f => f.fund_category === "General").reduce((sum, f) => sum + ((f.units || 0) * (f.current_nav || 0)), 0),
  };

  // Calculate total values for each investment type
  const investmentValues = {
    mutualFunds: mutualFunds.reduce((sum, f) => {
      // Use units * current_nav for accurate value
      const value = (f.units || 0) * (f.current_nav || 0);
      return sum + (value > 0 ? value : (f.current_value || 0));
    }, 0),
    stocks: stocks.reduce((sum, s) => {
      // Use shares * current_price for accurate value
      const value = (s.shares || 0) * (s.current_price || 0);
      return sum + (value > 0 ? value : (s.current_value || 0));
    }, 0),
    bonds: bonds.reduce((sum, b) => {
      // Use face_value or current_value
      return sum + (b.face_value || b.current_value || 0);
    }, 0),
    mt4Mt5: mt4TotalsTHB.equity, // Already in THB
    business: businessInvestments.reduce((sum, b) => {
      return sum + (b.current_value || b.initial_investment || 0);
    }, 0),
  };

  const totalInvestments = investmentValues.mutualFunds + investmentValues.stocks +
    investmentValues.bonds + investmentValues.mt4Mt5 + investmentValues.business;

  const formatCurrency = (value: number) => `฿${Math.round(value).toLocaleString()}`;

  const getInvestmentCurrentValue = (investment: Investment) => {
    if (investment.investment_type === "mutual_fund") {
      const value = (investment.units || 0) * (investment.current_nav || 0);
      return value > 0 ? value : (investment.current_value || 0);
    }

    if (investment.investment_type === "stock") {
      const value = (investment.shares || 0) * (investment.current_price || 0);
      return value > 0 ? value : (investment.current_value || 0);
    }

    if (investment.investment_type === "bond") {
      return investment.current_value || investment.face_value || 0;
    }

    if (investment.investment_type === "mt4_mt5") {
      return (investment.equity || investment.balance || 0) * USD_THB_RATE;
    }

    if (investment.investment_type === "business") {
      return investment.current_value || investment.initial_investment || 0;
    }

    return investment.current_value || investment.initial_investment || 0;
  };

  const getInvestmentCostBasis = (investment: Investment) => {
    if (investment.investment_type === "mutual_fund") {
      const cost = (investment.units || 0) * (investment.avg_cost || 0);
      return cost > 0 ? cost : (investment.initial_investment || investment.current_value || 0);
    }

    if (investment.investment_type === "stock") {
      const cost = (investment.shares || 0) * (investment.avg_price || 0);
      return cost > 0 ? cost : (investment.initial_investment || investment.current_value || 0);
    }

    if (investment.investment_type === "bond") {
      return investment.initial_investment || investment.face_value || investment.current_value || 0;
    }

    if (investment.investment_type === "mt4_mt5") {
      return (investment.balance || investment.equity || 0) * USD_THB_RATE;
    }

    return investment.initial_investment || investment.current_value || 0;
  };

  const performanceRows = investments.map((investment) => {
    const currentValue = getInvestmentCurrentValue(investment);
    const costBasis = getInvestmentCostBasis(investment);
    const gainLoss = currentValue - costBasis;
    const returnPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return { investment, currentValue, costBasis, gainLoss, returnPct };
  });

  const totalCostBasis = performanceRows.reduce((sum, row) => sum + row.costBasis, 0);
  const totalCurrentValue = performanceRows.reduce((sum, row) => sum + row.currentValue, 0);
  const totalUnrealizedGain = totalCurrentValue - totalCostBasis;
  const totalReturnPct = totalCostBasis > 0 ? (totalUnrealizedGain / totalCostBasis) * 100 : 0;

  const investmentTypeLabels: Record<string, string> = {
    mutual_fund: t('investments.mutualFunds'),
    stock: t('investments.stocks'),
    bond: t('investments.bonds'),
    mt4_mt5: t('investments.mt4Mt5'),
    business: t('investments.business'),
  };

  const targetAllocation: Record<string, number> = {
    mutual_fund: 50,
    stock: 20,
    bond: 15,
    mt4_mt5: 5,
    business: 10,
  };

  const allocationByType = Object.entries(investmentValues)
    .map(([key, value]) => {
      const type = key === "mutualFunds" ? "mutual_fund"
        : key === "stocks" ? "stock"
          : key === "bonds" ? "bond"
            : key === "mt4Mt5" ? "mt4_mt5"
              : "business";
      const percentage = totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0;
      const target = targetAllocation[type] || 0;
      const drift = percentage - target;

      return {
        type,
        label: investmentTypeLabels[type] || type,
        value,
        percentage,
        target,
        drift,
      };
    })
    .sort((a, b) => b.value - a.value);

  const allocationByCurrency = investments.reduce<Record<string, number>>((acc, investment) => {
    const currency = investment.currency || (investment.investment_type === "mt4_mt5" ? "USD" : "THB");
    acc[currency] = (acc[currency] || 0) + getInvestmentCurrentValue(investment);
    return acc;
  }, {});

  const taxAdvantagedValue = mutualFunds
    .filter(f => ["RMF", "SSF", "Thai ESG", "LTF"].includes(f.fund_category || ""))
    .reduce((sum, fund) => sum + getInvestmentCurrentValue(fund), 0);

  const concentratedAllocation = allocationByType.find(item => item.percentage >= 45);
  const tradingAllocation = allocationByType.find(item => item.type === "mt4_mt5")?.percentage || 0;
  const topPerformer = performanceRows
    .filter(row => row.costBasis > 0)
    .sort((a, b) => b.returnPct - a.returnPct)[0];
  const laggingPosition = performanceRows
    .filter(row => row.costBasis > 0)
    .sort((a, b) => a.returnPct - b.returnPct)[0];

  // Tax deduction tracker - use this_year_contribution if available, otherwise use total invested
  const getThisYearContribution = (fund: Investment) => {
    return fund.this_year_contribution || 0;
  };

  const rmfContribution = mutualFunds
    .filter(f => f.fund_category === "RMF")
    .reduce((sum, f) => sum + getThisYearContribution(f), 0);
  const ssfContribution = mutualFunds
    .filter(f => f.fund_category === "SSF")
    .reduce((sum, f) => sum + getThisYearContribution(f), 0);
  const thaiEsgContribution = mutualFunds
    .filter(f => f.fund_category === "Thai ESG")
    .reduce((sum, f) => sum + getThisYearContribution(f), 0);

  const rmfSsfThaiEsgContributed = selectedYear === currentYear 
    ? rmfContribution + ssfContribution + thaiEsgContribution
    : (savedTaxDeductions || 0);

  const taxDeductionMax = 500000;
  const taxDeductionProgress = (rmfSsfThaiEsgContributed / taxDeductionMax) * 100;

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

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('investments.title')}</h2>
          <p className="text-muted-foreground">{t('investments.description')}</p>
        </div>

        {/* Total Investments Summary */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardDescription>{t('investments.totalInvestments')}</CardDescription>
              <CardTitle className="text-3xl">฿{totalInvestments.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t('investments.allTypes')}</p>
            </CardContent>
          </Card>
          {/* Sort investment type cards by value (largest first) */}
          {[
            { name: t('investments.mutualFunds'), value: investmentValues.mutualFunds, count: mutualFunds.length, unit: "funds" },
            { name: t('investments.stocks'), value: investmentValues.stocks, count: stocks.length, unit: "stocks" },
            { name: t('investments.mt4Mt5'), value: investmentValues.mt4Mt5, count: mt4Accounts.length, unit: "accounts" },
            { name: t('investments.bonds'), value: investmentValues.bonds, count: bonds.length, unit: "bonds" },
            { name: t('investments.business'), value: investmentValues.business, count: businessInvestments.length, unit: "investments" },
          ]
            .sort((a, b) => b.value - a.value)
            .map((type) => (
              <Card key={type.name}>
                <CardHeader className="pb-2">
                  <CardDescription>{type.name}</CardDescription>
                  <CardTitle className="text-xl">฿{type.value.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {type.count} {type.unit} • {totalInvestments > 0 ? ((type.value / totalInvestments) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Investment Performance Dashboard
                </CardTitle>
                <CardDescription>
                  Portfolio return, allocation drift, and concentration signals across all investment accounts.
                </CardDescription>
              </div>
              <Badge variant={totalUnrealizedGain >= 0 ? "default" : "destructive"} className="w-fit">
                {totalReturnPct >= 0 ? "+" : ""}{totalReturnPct.toFixed(2)}% total return
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Cost Basis</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCostBasis)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Amount originally invested or deposited</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCurrentValue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{investments.length} active investment(s)</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Unrealized Gain/Loss</p>
                <p className={`mt-1 text-2xl font-bold ${totalUnrealizedGain >= 0 ? "text-success" : "text-destructive"}`}>
                  {totalUnrealizedGain >= 0 ? "+" : ""}{formatCurrency(totalUnrealizedGain)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Before dividends, fees, and realized exits</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Tax-Advantaged Value</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(taxAdvantagedValue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">RMF, SSF, Thai ESG, and LTF holdings</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Allocation by Asset Type</h3>
                </div>
                <div className="space-y-4">
                  {allocationByType.map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <span className="font-medium">{item.label}</span>
                          <span className="ml-2 text-muted-foreground">{formatCurrency(item.value)}</span>
                        </div>
                        <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(100, item.percentage)} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Portfolio Drift</h3>
                </div>
                <div className="space-y-3">
                  {allocationByType.map((item) => {
                    const action = Math.abs(item.drift) <= 5 ? "On target" : item.drift > 0 ? "Trim future buys" : "Add on next buy";

                    return (
                      <div key={item.type} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Target {item.target}% • Current {item.percentage.toFixed(1)}%
                            </p>
                          </div>
                          <Badge variant={Math.abs(item.drift) <= 5 ? "secondary" : "outline"}>
                            {item.drift >= 0 ? "+" : ""}{item.drift.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{action}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Currency Exposure</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(allocationByCurrency).length > 0 ? Object.entries(allocationByCurrency).map(([currency, value]) => (
                    <div key={currency} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{currency}</span>
                      <span className="font-medium">
                        {totalCurrentValue > 0 ? ((value / totalCurrentValue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Add investments to see exposure.</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Best / Weakest Position</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Best</span>
                    <span className="font-medium text-success">
                      {topPerformer ? `${topPerformer.investment.name} +${topPerformer.returnPct.toFixed(1)}%` : "Not enough cost data"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Weakest</span>
                    <span className={laggingPosition && laggingPosition.returnPct < 0 ? "font-medium text-destructive" : "font-medium"}>
                      {laggingPosition ? `${laggingPosition.investment.name} ${laggingPosition.returnPct >= 0 ? "+" : ""}${laggingPosition.returnPct.toFixed(1)}%` : "Not enough cost data"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Risk Signals</p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p>
                    {concentratedAllocation
                      ? `${concentratedAllocation.label} is ${concentratedAllocation.percentage.toFixed(1)}% of the portfolio.`
                      : "No single asset type is above 45%."}
                  </p>
                  <p>
                    {tradingAllocation > 10
                      ? `Trading accounts are ${tradingAllocation.toFixed(1)}%; review position sizing.`
                      : "Trading account exposure is within the default target."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="mutualfunds" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="mutualfunds">{t('investments.mutualFunds')}</TabsTrigger>
            <TabsTrigger value="stocks">{t('investments.stocks')}</TabsTrigger>
            <TabsTrigger value="bonds">{t('investments.bonds')}</TabsTrigger>
            <TabsTrigger value="mt4">MT4/MT5</TabsTrigger>
            <TabsTrigger value="business">{t('investments.business')}</TabsTrigger>
          </TabsList>

          {/* Mutual Funds Tab */}
          <TabsContent value="mutualfunds" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={mutualFundFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMutualFundFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={mutualFundFilter === "RMF" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMutualFundFilter("RMF")}
                >
                  RMF
                </Button>
                <Button
                  variant={mutualFundFilter === "LTF" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMutualFundFilter("LTF")}
                >
                  LTF
                </Button>
                <Button
                  variant={mutualFundFilter === "Thai ESG" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMutualFundFilter("Thai ESG")}
                >
                  Thai ESG
                </Button>
                <Button
                  variant={mutualFundFilter === "SSF" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMutualFundFilter("SSF")}
                >
                  SSF
                </Button>
                <Button
                  variant={mutualFundFilter === "General" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMutualFundFilter("General")}
                >
                  General
                </Button>
              </div>
              <Button onClick={() => handleAddInvestment("mutual_fund")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mutual Fund
              </Button>
            </div>

            {/* Thai Tax Deduction Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>{t('investments.taxTracker')}</CardTitle>
                <CardDescription>
                  {t('investments.taxTrackerDesc')} ({selectedYear === currentYear ? "This Year's Estimates" : `Saved tax data from ${selectedYear}`})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('investments.contributedIn')} {selectedYear}</span>
                    <span className="font-bold">฿{rmfSsfThaiEsgContributed.toLocaleString()}</span>
                  </div>
                  <Progress value={taxDeductionProgress} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{taxDeductionProgress.toFixed(1)}% of maximum</span>
                    <span>{t('investments.remaining')}{Math.max(0, taxDeductionMax - rmfSsfThaiEsgContributed).toLocaleString()}</span>
                  </div>
                  {rmfSsfThaiEsgContributed === 0 && selectedYear === currentYear && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('investments.addContributionHint')}
                    </p>
                  )}
                  {savedTaxDeductions === null && selectedYear !== currentYear && (
                    <p className="text-xs text-muted-foreground mt-2 text-warning">
                      {t('investments.noTaxDataInfo')} {selectedYear}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Summary (shown when All filter is selected) */}
            {mutualFundFilter === "all" && mutualFunds.length > 0 && (
              <div className="grid gap-4 md:grid-cols-5">
                {Object.entries(categoryTotals).map(([category, total]) => (
                  <Card key={category}>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground">{category}</p>
                      <p className="text-lg font-bold">฿{total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {mutualFunds.filter(f => f.fund_category === category).length} fund(s)
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Mutual Funds Table */}
            <Card>
              <CardContent className="pt-6">
                {mutualFunds.filter(f => mutualFundFilter === "all" || f.fund_category === mutualFundFilter).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fund Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Avg Cost</TableHead>
                        <TableHead className="text-right">Current NAV</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mutualFunds
                        .filter(f => mutualFundFilter === "all" || f.fund_category === mutualFundFilter)
                        .map((fund) => {
                          const currentValue = (fund.units || 0) * (fund.current_nav || 0);
                          const cost = (fund.units || 0) * (fund.avg_cost || 0);
                          const gainLoss = currentValue - cost;
                          const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

                          return (
                            <TableRow key={fund.id}>
                              <TableCell className="font-medium">{fund.name}</TableCell>
                              <TableCell>{fund.fund_code || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={fund.fund_category === "RMF" ? "default" : fund.fund_category === "LTF" ? "secondary" : "outline"}>
                                  {fund.fund_category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{(fund.units || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right">฿{(fund.avg_cost || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right">฿{(fund.current_nav || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">฿{currentValue.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <div className={gainLoss >= 0 ? "text-success" : "text-destructive"}>
                                  <div className="font-medium">฿{gainLoss.toLocaleString()}</div>
                                  <div className="text-xs">{gainLossPercent >= 0 ? "+" : ""}{gainLossPercent.toFixed(2)}%</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditInvestment(fund)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(fund.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No mutual funds found</p>
                    <Button className="mt-4" onClick={() => handleAddInvestment("mutual_fund")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Mutual Fund
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      ฿{stocks.reduce((sum, s) => sum + ((s.shares || 0) * (s.current_price || 0)), 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-success">
                      +฿{stocks.reduce((sum, s) => {
                        const marketValue = (s.shares || 0) * (s.current_price || 0);
                        const cost = (s.shares || 0) * (s.avg_price || 0);
                        return sum + (marketValue - cost);
                      }, 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button onClick={() => handleAddInvestment("stock")}>
                <Plus className="h-4 w-4 mr-2" />
                {t('investments.addInvestment')}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {stocks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Exchange</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Avg Price</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stocks.map((stock) => {
                        const marketValue = (stock.shares || 0) * (stock.current_price || 0);
                        const cost = (stock.shares || 0) * (stock.avg_price || 0);
                        const unrealizedGain = marketValue - cost;
                        const unrealizedGainPercent = cost > 0 ? (unrealizedGain / cost) * 100 : 0;

                        return (
                          <TableRow key={stock.id}>
                            <TableCell className="font-bold">{stock.symbol || stock.name}</TableCell>
                            <TableCell>{stock.company_name || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{stock.exchange || "N/A"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{(stock.shares || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">฿{(stock.avg_price || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">฿{(stock.current_price || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">฿{marketValue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <div className={unrealizedGain >= 0 ? "text-success" : "text-destructive"}>
                                <div className="font-medium">฿{unrealizedGain.toLocaleString()}</div>
                                <div className="text-xs">{unrealizedGainPercent >= 0 ? "+" : ""}{unrealizedGainPercent.toFixed(2)}%</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{stock.sector || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEditInvestment(stock)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(stock.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No stocks found</p>
                    <Button className="mt-4" onClick={() => handleAddInvestment("stock")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Stock
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bonds Tab */}
          <TabsContent value="bonds" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Total Bond Value</h3>
                <p className="text-3xl font-bold text-primary">
                  ฿{bonds.reduce((sum, b) => sum + (b.current_value || 0), 0).toLocaleString()}
                </p>
              </div>
              <Button onClick={() => handleAddInvestment("bond")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bond
              </Button>
            </div>

            <div className="grid gap-6">
              {bonds.length > 0 ? (
                bonds.map((bond) => (
                  <Card key={bond.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{bond.name}</CardTitle>
                          <CardDescription>Issuer: {bond.issuer || "N/A"}</CardDescription>
                        </div>
                        <Badge>{bond.bond_type || "Bond"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Face Value</p>
                          <p className="text-lg font-semibold">฿{(bond.face_value || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="text-lg font-semibold">฿{(bond.current_value || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Coupon Rate</p>
                          <p className="text-lg font-semibold">{bond.coupon_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Maturity Date</p>
                          <p className="text-lg font-semibold">{bond.maturity_date || "N/A"}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditInvestment(bond)}>
                          <Pencil className="h-3 w-3 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteClick(bond.id)}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <p className="text-muted-foreground">No bonds found</p>
                      <Button className="mt-4" onClick={() => handleAddInvestment("bond")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Bond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* MT4/MT5 Trading Tab */}
          <TabsContent value="mt4" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Track your MT4/MT5 trading accounts manually
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mt4Accounts.length} account(s) • Total: ${mt4TotalsUSD.equity.toLocaleString()} USD (฿{mt4TotalsTHB.equity.toLocaleString()} THB)
                </p>
              </div>
              <Button onClick={() => handleAddInvestment("mt4_mt5")}>
                <Plus className="h-4 w-4 mr-2" />
                Add MT4/MT5 Account
              </Button>
            </div>

            {/* MT4/MT5 Summary Cards */}
            {mt4Accounts.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Equity (THB)</CardDescription>
                    <CardTitle className="text-2xl">฿{mt4TotalsTHB.equity.toLocaleString()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">${mt4TotalsUSD.equity.toLocaleString()} USD @ ฿{USD_THB_RATE}/USD</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Balance (THB)</CardDescription>
                    <CardTitle className="text-2xl">฿{mt4TotalsTHB.balance.toLocaleString()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">${mt4TotalsUSD.balance.toLocaleString()} USD</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total P/L (THB)</CardDescription>
                    <CardTitle className={`text-2xl ${mt4TotalsTHB.profitLoss >= 0 ? "text-success" : "text-destructive"}`}>
                      {mt4TotalsTHB.profitLoss >= 0 ? "+" : ""}฿{mt4TotalsTHB.profitLoss.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {mt4TotalsUSD.profitLoss >= 0 ? "+" : ""}${mt4TotalsUSD.profitLoss.toLocaleString()} USD
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mt4Accounts.length > 0 ? (
                mt4Accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {account.broker || account.name}
                            <Badge variant="outline" className="text-xs">
                              {account.mt_platform || "MT5"}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {account.account_number ? `#${account.account_number}` : "No account number"}
                          </CardDescription>
                          {account.mt_server && (
                            <p className="text-xs text-muted-foreground mt-1">{account.mt_server}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <Badge variant={account.account_type === "Live" ? "default" : "secondary"}>
                          {account.account_type || "Live"}
                        </Badge>
                      </div>

                      {account.api_key && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">API Status</span>
                          <Badge variant={account.sync_status === "active" ? "default" : "secondary"}>
                            {account.sync_status === "active" ? "Syncing" : "Pending"}
                          </Badge>
                        </div>
                      )}

                      {account.last_sync && (
                        <div className="text-xs text-muted-foreground">
                          Last sync: {new Date(account.last_sync).toLocaleString()}
                        </div>
                      )}

                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Balance</span>
                          <span className="font-medium">${(account.balance || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Equity</span>
                          <span className="font-medium">${(account.equity || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">P/L</span>
                          <span className={`font-medium ${(account.profit_loss || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                            {(account.profit_loss || 0) >= 0 ? "+" : ""}${(account.profit_loss || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditInvestment(account)}>
                          <Pencil className="h-3 w-3 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeleteClick(account.id)}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <p className="text-muted-foreground">No MT4/MT5 accounts found</p>
                      <Button className="mt-4" onClick={() => handleAddInvestment("mt4_mt5")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First MT4/MT5 Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Business Investments Tab */}
          <TabsContent value="business" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Total Business Investment Value</h3>
                <p className="text-3xl font-bold text-primary">
                  ฿{businessInvestments.reduce((sum, b) => sum + (b.current_value || 0), 0).toLocaleString()}
                </p>
              </div>
              <Button onClick={() => handleAddInvestment("business")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Business Investment
              </Button>
            </div>

            <div className="grid gap-6">
              {businessInvestments.length > 0 ? (
                businessInvestments.map((business) => {
                  const roi = business.initial_investment && business.initial_investment > 0
                    ? (((business.current_value || 0) - business.initial_investment) / business.initial_investment) * 100
                    : 0;

                  return (
                    <Card key={business.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{business.business_name || business.name}</CardTitle>
                            <CardDescription>Invested: {business.investment_date || "N/A"}</CardDescription>
                          </div>
                          <Badge>Business</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Investment Amount</p>
                            <p className="text-lg font-semibold">฿{(business.initial_investment || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Valuation</p>
                            <p className="text-lg font-semibold">฿{(business.current_value || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ownership</p>
                            <p className="text-lg font-semibold">{business.ownership_percent || 0}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">ROI</p>
                            <p className={`text-lg font-semibold ${roi >= 0 ? "text-success" : "text-destructive"}`}>
                              {roi >= 0 ? "+" : ""}{roi.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditInvestment(business)}>
                            <Pencil className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteClick(business.id)}>
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <p className="text-muted-foreground">No business investments found</p>
                      <Button className="mt-4" onClick={() => handleAddInvestment("business")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Business Investment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <InvestmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          investment={selectedInvestment}
          onSuccess={() => fetchInvestmentsAndTax()}
          defaultType={defaultType}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this investment from your records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Investments;
