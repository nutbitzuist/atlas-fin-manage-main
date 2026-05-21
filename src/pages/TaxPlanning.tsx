import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useYear } from "@/contexts/YearContext";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, AlertCircle, CheckCircle, Save, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import type { Json, Tables } from "@/integrations/supabase/types";
import { getErrorMessage } from "@/utils/errors";
import { getProfileDisplayName } from "@/services/profile-service";
import { getAssetSummary } from "@/services/financial-overview-service";
import { getTaxPlanningByUserAndYear, upsertTaxPlanning } from "@/services/tax-planning-service";
import { getInsurancePoliciesByUser } from "@/services/insurance-service";

// Thai Tax Brackets for 2025
const TAX_BRACKETS = [
  { min: 0, max: 150000, rate: 0 },
  { min: 150001, max: 300000, rate: 0.05 },
  { min: 300001, max: 500000, rate: 0.10 },
  { min: 500001, max: 750000, rate: 0.15 },
  { min: 750001, max: 1000000, rate: 0.20 },
  { min: 1000001, max: 2000000, rate: 0.25 },
  { min: 2000001, max: 5000000, rate: 0.30 },
  { min: 5000001, max: Infinity, rate: 0.35 }
];

const PERSONAL_ALLOWANCE = 60000;

const formatTHB = (value: number) => `฿${Math.max(0, Math.round(value)).toLocaleString()}`;

interface DeductionCategory {
  id: string;
  title: string;
  maxAmount: number;
  currentAmount: number;
  description: string;
  isAutoCalculated: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function TaxPlanning() {
  const navigate = useNavigate();
  const { t } = useTranslation('finances');
  const { selectedYear } = useYear();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [annualIncome, setAnnualIncome] = useState<number>(0);
  const [savedIncome, setSavedIncome] = useState<number>(0);

  // Deduction categories
  const [deductions, setDeductions] = useState<DeductionCategory[]>([
    {
      id: "rmf_ltf",
      title: "RMF + SSF + Thai ESG Combined",
      maxAmount: 500000,
      currentAmount: 0,
      description: "Retirement Mutual Funds, Super Savings Fund, and Thai ESG Funds",
      isAutoCalculated: true
    },
    {
      id: "life_insurance",
      title: "Life Insurance Premiums",
      maxAmount: 100000,
      currentAmount: 0,
      description: "Life insurance premium payments",
      isAutoCalculated: true
    },
    {
      id: "health_insurance",
      title: "Health Insurance Premiums",
      maxAmount: 25000,
      currentAmount: 0,
      description: "Health and medical insurance premiums",
      isAutoCalculated: true
    },
    {
      id: "provident_fund",
      title: "Provident Fund / PVD",
      maxAmount: 500000,
      currentAmount: 0,
      description: "Contributions to provident fund",
      isAutoCalculated: false
    },
    {
      id: "home_loan",
      title: "Home Loan Interest",
      maxAmount: 100000,
      currentAmount: 0,
      description: "Interest paid on home mortgage",
      isAutoCalculated: false
    }
  ]);

  const [donationAmount, setDonationAmount] = useState<number>(0);

  useEffect(() => {
    checkUser();
    loadTaxData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      setUserName(await getProfileDisplayName(session.user.id, "User"));
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadTaxData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const taxData = await getTaxPlanningByUserAndYear(session.user.id, selectedYear);

      if (taxData) {
        // Load saved data
        const income = Number(taxData.annual_income) || 0;
        setSavedIncome(income);
        setAnnualIncome(income);
        setDonationAmount(Number(taxData.donation_amount) || 0);

        // Load deductions from JSONB
        const savedDeductions = isRecord(taxData.deductions) ? taxData.deductions : {};
        setDeductions(prev => prev.map(d => ({
          ...d,
          currentAmount: Number(savedDeductions[d.id]) || 0
        })));
      } else {
        // No saved data - try to auto-calculate from other tables
        await autoCalculateDeductions(session.user.id, true);
      }
    } catch (error) {
      console.error("Error in loadTaxData:", error);
    }
  };

  const autoCalculateDeductions = async (userId: string, isInitialLoad: boolean = false) => {
    try {
      // Auto-calculate deductions from investments and insurance
      const [assetSummary, insuranceData] = await Promise.all([
        getAssetSummary(userId, "active"),
        getInsurancePoliciesByUser(userId, {
          status: "active",
          orderBy: "renewal_date",
          ascending: true,
        }),
      ]);

      let rmf_ltf = 0;
      let life_insurance = 0;
      let health_insurance = 0;
      // Calculate RMF/SSF/Thai ESG from mutual fund investments
      // Use this_year_contribution if available, otherwise fall back to current_value
      if (assetSummary.investments) {
        const getContribution = (inv: Tables<"investments">) => {
          // Prefer this_year_contribution for tax-deductible amounts
          if (inv.this_year_contribution && inv.this_year_contribution > 0) {
            return Number(inv.this_year_contribution);
          }
          // Fall back to units * avg_cost for total invested
          if (inv.units && inv.avg_cost) {
            return Number(inv.units) * Number(inv.avg_cost);
          }
          return Number(inv.current_value || 0);
        };

        rmf_ltf = assetSummary.investments
          .filter(inv => inv.investment_type === 'mutual_fund' &&
            (inv.fund_category === 'RMF' || inv.fund_category === 'SSF' || inv.fund_category === 'Thai ESG'))
          .reduce((sum, inv) => sum + getContribution(inv), 0);
      }

      // Calculate insurance premiums seamlessly with insurance tracking
      if (insuranceData) {
        insuranceData.forEach((policy: Tables<"insurance_policies">) => {
          // Skip policies explicitly marked as non-deductible
          if (policy.tax_deductible === false) return;

          const annualPremium = Number(policy.premium_amount || 0);
          const frequency = (policy.premium_frequency || "yearly").toLowerCase();
          const calculatedAnnual = frequency === "monthly" ? annualPremium * 12 :
            frequency === "quarterly" ? annualPremium * 4 : annualPremium;

          // Check explicit category first, then fallback to policy_type matching
          const category = policy.tax_deduction_category;
          const type = (policy.policy_type || "").toLowerCase();

          if (category === 'life_insurance' || type === 'life') {
            life_insurance += calculatedAnnual;
          } else if (category === 'health_insurance' || type === 'health' || type === 'critical' || type === 'accident') {
            health_insurance += calculatedAnnual;
          }
        });
      }

      // Only auto-fill if the current value is 0 (first calculation)
      setDeductions(prev => prev.map(d => {
        if (d.id === "rmf_ltf" && d.currentAmount === 0) return { ...d, currentAmount: Math.min(rmf_ltf, d.maxAmount) };
        if (d.id === "life_insurance" && d.currentAmount === 0) return { ...d, currentAmount: Math.min(life_insurance, d.maxAmount) };
        if (d.id === "health_insurance" && d.currentAmount === 0) return { ...d, currentAmount: Math.min(health_insurance, d.maxAmount) };
        // Home loan is strictly manual now to avoid mock estimates
        return d;
      }));

      if (!isInitialLoad) {
        toast.success("Deductions synchronized with current assets and insurance!");
      }
    } catch (error) {
      console.error("Error auto-calculating deductions:", error);
    }
  };

  const handleSaveIncome = async () => {
    if (annualIncome < 0) {
      toast.error("Income cannot be negative");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to save data");
        return;
      }

      // Prepare deductions object
      const deductionsObject: Record<string, number> = {};
      deductions.forEach(d => {
        deductionsObject[d.id] = d.currentAmount;
      });

      // Calculate totals for saving
      const totalDeductions = calculateTotalDeductions();
      const taxableIncome = Math.max(0, annualIncome - totalDeductions - PERSONAL_ALLOWANCE);
      const estimatedTax = calculateTax(taxableIncome);

      // Upsert (insert or update) tax planning data
      await upsertTaxPlanning({
        user_id: session.user.id,
        tax_year: selectedYear,
        annual_income: annualIncome,
        deductions: deductionsObject as Json,
        donation_amount: donationAmount,
        total_deductions: totalDeductions,
        taxable_income: taxableIncome,
        estimated_tax: estimatedTax,
        updated_at: new Date().toISOString()
      });

      setSavedIncome(annualIncome);
      toast.success("Tax planning data saved successfully!");
    } catch (error: unknown) {
      console.error("Error saving tax data:", error);
      toast.error(getErrorMessage(error, "Failed to save tax data"));
    }
  };

  const handleUpdateDeduction = (id: string, amount: number) => {
    setDeductions(prev => prev.map(d =>
      d.id === id ? { ...d, currentAmount: Math.min(amount, d.maxAmount) } : d
    ));
  };

  const handleSaveAll = async () => {
    await handleSaveIncome();
  };

  const calculateTotalDeductions = () => {
    const deductionTotal = deductions.reduce((sum, d) => sum + d.currentAmount, 0);
    const maxDonation = Math.max(0, (savedIncome - deductionTotal) * 0.1);
    const actualDonation = Math.min(donationAmount, maxDonation);
    return deductionTotal + actualDonation;
  };

  const calculateTax = (income: number) => {
    let tax = 0;
    let remainingIncome = income;

    for (const bracket of TAX_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min + 1
      );

      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return tax;
  };

  const getTaxCalculation = () => {
    const totalDeductions = calculateTotalDeductions();
    const taxableIncome = Math.max(0, savedIncome - totalDeductions - PERSONAL_ALLOWANCE);
    const estimatedTax = calculateTax(taxableIncome);
    const taxWithoutDeductions = calculateTax(Math.max(0, savedIncome - PERSONAL_ALLOWANCE));
    const taxSavings = taxWithoutDeductions - estimatedTax;
    const marginalBracket = TAX_BRACKETS.find(bracket => taxableIncome >= bracket.min && taxableIncome <= bracket.max) || TAX_BRACKETS[0];
    const effectiveTaxRate = savedIncome > 0 ? (estimatedTax / savedIncome) * 100 : 0;

    return {
      assessableIncome: savedIncome,
      totalDeductions,
      personalAllowance: PERSONAL_ALLOWANCE,
      taxableIncome,
      estimatedTax,
      taxSavings,
      marginalRate: marginalBracket.rate,
      effectiveTaxRate
    };
  };

  const getDeductionRoom = () => {
    const providentFundAmount = deductions.find(d => d.id === "provident_fund")?.currentAmount || 0;
    return deductions.map(deduction => {
      const effectiveMax = deduction.id === "rmf_ltf"
        ? Math.max(0, 500000 - providentFundAmount)
        : deduction.maxAmount;
      const remaining = Math.max(0, effectiveMax - deduction.currentAmount);
      const potentialSaving = remaining * taxCalc.marginalRate;

      return {
        ...deduction,
        effectiveMax,
        remaining,
        potentialSaving,
        progress: effectiveMax > 0 ? (deduction.currentAmount / effectiveMax) * 100 : 0,
      };
    });
  };

  const getRecommendations = () => {
    const deductionRoom = getDeductionRoom();
    const maxDonation = Math.max(0, (savedIncome - deductions.reduce((sum, d) => sum + d.currentAmount, 0)) * 0.1);
    const donationRemaining = Math.max(0, maxDonation - donationAmount);
    const recommendations = deductionRoom
      .filter(d => d.remaining > 0)
      .sort((a, b) => b.potentialSaving - a.potentialSaving)
      .slice(0, 4)
      .map(d => ({
        title: d.title,
        message: `Remaining room ${formatTHB(d.remaining)} with estimated tax savings around ${formatTHB(d.potentialSaving)} at your marginal rate.`,
        amount: d.remaining,
        saving: d.potentialSaving,
      }));

    if (donationRemaining > 0) {
      recommendations.push({
        title: "Charitable Donations",
        message: `Donation room remains ${formatTHB(donationRemaining)} after other deductions.`,
        amount: donationRemaining,
        saving: donationRemaining * taxCalc.marginalRate,
      });
    }

    return recommendations;
  };

  const getYearEndChecklist = () => {
    const deductionRoom = getDeductionRoom();
    const rmfRoom = deductionRoom.find(d => d.id === "rmf_ltf")?.remaining || 0;
    const insuranceRoom = (deductionRoom.find(d => d.id === "life_insurance")?.remaining || 0) +
      (deductionRoom.find(d => d.id === "health_insurance")?.remaining || 0);
    const donationLimit = Math.max(0, (savedIncome - deductions.reduce((sum, d) => sum + d.currentAmount, 0)) * 0.1);

    return [
      {
        title: "Review RMF, SSF, and Thai ESG purchases",
        status: rmfRoom <= 0 ? "Done" : "Open",
        detail: rmfRoom <= 0 ? "Combined investment room is filled." : `${formatTHB(rmfRoom)} room remains before December 31.`,
      },
      {
        title: "Confirm insurance certificates",
        status: insuranceRoom <= 0 ? "Done" : "Check",
        detail: "Make sure life and health policy certificates are available for filing.",
      },
      {
        title: "Validate home loan interest",
        status: (deductions.find(d => d.id === "home_loan")?.currentAmount || 0) > 0 ? "Done" : "Check",
        detail: "Enter actual bank certificate interest instead of an estimate.",
      },
      {
        title: "Plan donations",
        status: donationAmount >= donationLimit && donationLimit > 0 ? "Done" : "Optional",
        detail: donationLimit > 0 ? `${formatTHB(Math.max(0, donationLimit - donationAmount))} donation room remains.` : "Donation room appears unavailable until income is saved.",
      },
      {
        title: "Save final tax plan",
        status: savedIncome > 0 ? "Done" : "Open",
        detail: "Saving locks the estimate for dashboards and investment tax trackers.",
      },
    ];
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
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

  const taxCalc = getTaxCalculation();
  const recommendations = getRecommendations();
  const deductionRoom = getDeductionRoom();
  const yearEndChecklist = getYearEndChecklist();

  return (
    <Layout userName={userName}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('taxPlanning.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('taxPlanning.description')} {selectedYear}</p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) await autoCalculateDeductions(session.user.id);
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Sync with Real-time Data
          </Button>
        </div>

        {/* Annual Income Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Annual Assessable Income
            </CardTitle>
            <CardDescription>
              Enter your total annual income for tax year {selectedYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="income">Annual Income (฿)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="0"
                  value={annualIncome || ""}
                  onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
                  className="text-2xl h-14 mt-2"
                />
              </div>
              <Button onClick={handleSaveIncome} size="lg" className="gap-2">
                <Save className="h-5 w-5" />
                Save Income
              </Button>
            </div>
            {savedIncome > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                Saved income: ฿{savedIncome.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Thai Tax Optimization Assistant */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Thai Tax Optimization Assistant
            </CardTitle>
            <CardDescription>
              See remaining deduction room, estimated tax-saving opportunities, and year-end filing actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Marginal Tax Rate</p>
                <p className="mt-1 text-2xl font-bold">{(taxCalc.marginalRate * 100).toFixed(0)}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Used to estimate next-baht savings</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                <p className="mt-1 text-2xl font-bold">{taxCalc.effectiveTaxRate.toFixed(2)}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Estimated tax divided by assessable income</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Deduction Room Left</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatTHB(deductionRoom.reduce((sum, item) => sum + item.remaining, 0))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Before donation limits</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Estimated Savings Found</p>
                <p className="mt-1 text-2xl font-bold text-success">
                  {formatTHB(recommendations.reduce((sum, item) => sum + item.saving, 0))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Based on current marginal rate</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold">Highest-Impact Opportunities</h3>
                {recommendations.length > 0 ? (
                  recommendations.map((recommendation, index) => (
                    <div key={`${recommendation.title}-${index}`} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{recommendation.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{recommendation.message}</p>
                        </div>
                        <Badge variant="secondary">{formatTHB(recommendation.saving)}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-success/20 bg-success/10 p-4">
                    <p className="font-medium text-success">No major deduction gaps found.</p>
                    <p className="mt-1 text-sm text-muted-foreground">Keep receipts and review again before year-end.</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Year-End Tax Checklist</h3>
                {yearEndChecklist.map((item) => (
                  <div key={item.title} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                      <Badge variant={item.status === "Done" ? "default" : item.status === "Open" ? "destructive" : "outline"}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Visible assumptions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Uses Thai progressive personal income tax brackets shown below, a {formatTHB(PERSONAL_ALLOWANCE)} personal allowance,
                user-entered income, synced investment and insurance data, and capped deduction limits configured on this page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deduction Capacity Meters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Deduction Capacity</CardTitle>
            <CardDescription>Track your tax deduction contributions and remaining capacity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {deductions.map((deduction, index) => {
              // For RMF+SSF+Thai ESG, adjust max by subtracting Provident Fund
              const providentFundAmount = deductions.find(d => d.id === "provident_fund")?.currentAmount || 0;
              const effectiveMax = deduction.id === "rmf_ltf"
                ? Math.max(0, 500000 - providentFundAmount)
                : deduction.maxAmount;

              const percentage = effectiveMax > 0 ? (deduction.currentAmount / effectiveMax) * 100 : 0;
              const remaining = Math.max(0, effectiveMax - deduction.currentAmount);
              const isEven = index % 2 === 0;

              return (
                <div
                  key={deduction.id}
                  className={`p-4 rounded-lg border mb-2 ${isEven ? 'bg-muted/30' : 'bg-background'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {deduction.title}
                        {deduction.isAutoCalculated ? (
                          <Badge variant="secondary" className="text-xs">Synced</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Manual</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{deduction.description}</p>
                      <p className="text-xs italic text-primary mt-1">You can manually edit the amount below</p>
                      {deduction.id === "rmf_ltf" && providentFundAmount > 0 && (
                        <p className="text-xs text-orange-500 mt-1">
                          Note: Max reduced by ฿{providentFundAmount.toLocaleString()} Provident Fund
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Max: ฿{effectiveMax.toLocaleString()}</p>
                      {deduction.id === "rmf_ltf" && providentFundAmount > 0 && (
                        <p className="text-xs text-muted-foreground">(500k - PF)</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Input
                      type="number"
                      placeholder="0"
                      value={deduction.currentAmount || ""}
                      onChange={(e) => handleUpdateDeduction(deduction.id, parseFloat(e.target.value) || 0)}
                      className="max-w-[200px]"
                    />
                    <span className="text-muted-foreground flex items-center">฿</span>
                  </div>

                  <div className="space-y-2">
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className={percentage >= 100 ? "text-green-600 font-medium" : ""}>
                        Used: ฿{deduction.currentAmount.toLocaleString()} ({Math.min(percentage, 100).toFixed(0)}%)
                      </span>
                      <span className={remaining === 0 ? "text-green-600" : "text-muted-foreground"}>
                        Remaining: ฿{remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Donations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Charitable Donations</CardTitle>
            <CardDescription>Max 10% of income after other deductions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label>Donation Amount (฿)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={donationAmount || ""}
                  onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Max: {formatTHB((savedIncome - deductions.reduce((sum, d) => sum + d.currentAmount, 0)) * 0.1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save All Button */}
        <div className="pt-4 border-t mb-8">
          <Button onClick={handleSaveAll} size="lg" className="w-full gap-2">
            <Save className="h-5 w-5" />
            {t('taxPlanning.saveTaxPlan')}
          </Button>
        </div>

        {/* Tax Calculator */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tax Calculation Summary</CardTitle>
              <CardDescription>Your estimated tax for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Assessable Income</span>
                <span className="font-medium">฿{taxCalc.assessableIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Less: Total Deductions</span>
                <span className="font-medium text-success">-฿{taxCalc.totalDeductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Less: Personal Allowance</span>
                <span className="font-medium text-success">-฿{taxCalc.personalAllowance.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Taxable Income</span>
                  <span className="font-bold">฿{taxCalc.taxableIncome.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Estimated Tax</span>
                  <span className="text-2xl font-bold text-destructive">
                    ฿{taxCalc.estimatedTax.toLocaleString()}
                  </span>
                </div>
                {taxCalc.taxSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax Savings from Deductions</span>
                    <span className="font-medium text-success">฿{taxCalc.taxSavings.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Thai Tax Brackets */}
          <Card>
            <CardHeader>
              <CardTitle>Thai Tax Brackets (2025)</CardTitle>
              <CardDescription>Progressive income tax rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TAX_BRACKETS.map((bracket, index) => (
                  <div
                    key={index}
                    className={`flex justify-between py-2 px-3 rounded ${taxCalc.taxableIncome >= bracket.min && taxCalc.taxableIncome <= bracket.max
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-muted/50'
                      }`}
                  >
                    <span className="text-sm">
                      ฿{bracket.min.toLocaleString()} - {bracket.max === Infinity ? '∞' : `฿${bracket.max.toLocaleString()}`}
                    </span>
                    <span className="font-medium">{(bracket.rate * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div >

        {/* Optimization Recommendations */}
        < Card >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Tax Optimization Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions to maximize your tax savings before year-end
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 p-4 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-success">Fully Optimized!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've maximized all available deductions for this tax year.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-sm">Important Reminders</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Contributions must be made before December 31, {selectedYear}</li>
                    <li>Keep all receipts and documentation for tax filing</li>
                    <li>This is an estimate - consult with a tax professional for accurate filing</li>
                    <li>Tax laws and deduction limits may change annually</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card >
      </div >
    </Layout >
  );
}
