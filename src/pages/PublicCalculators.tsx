import { useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Calculator, Copy, Download, Link as LinkIcon, LogIn, Save, Share2 } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type CalculatorField = {
  key: string;
  label: string;
  defaultValue: number;
  suffix?: string;
};

type CalculatorConfig = {
  slug: string;
  title: string;
  description: string;
  category: string;
  fields: CalculatorField[];
  assumptions: string[];
  faq: Array<{ q: string; a: string }>;
};

const formatTHB = (value: number) => `฿${Math.max(0, Math.round(value)).toLocaleString()}`;
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const calculators: CalculatorConfig[] = [
  {
    slug: "thai-income-tax-calculator",
    title: "Thai Income Tax Calculator",
    description: "Estimate Thai personal income tax using progressive brackets, deductions, and personal allowance.",
    category: "Thai Tax",
    fields: [
      { key: "income", label: "Annual income", defaultValue: 1200000 },
      { key: "deductions", label: "Other deductions", defaultValue: 160000 },
      { key: "allowance", label: "Personal allowance", defaultValue: 60000 },
    ],
    assumptions: ["Uses Thai progressive personal income tax brackets.", "Does not replace professional filing advice.", "Amounts are in THB."],
    faq: [
      { q: "Does this include all Thai deductions?", a: "It includes the deductions you enter manually and the personal allowance field." },
      { q: "Can I save this in Atlas?", a: "Yes. Use the save CTA to move into the tax planning workflow." },
    ],
  },
  {
    slug: "rmf-deduction-calculator",
    title: "RMF Deduction Calculator",
    description: "Estimate RMF contribution room and possible tax savings.",
    category: "Thai Tax",
    fields: [
      { key: "income", label: "Annual income", defaultValue: 1200000 },
      { key: "current", label: "Current RMF contribution", defaultValue: 50000 },
      { key: "rate", label: "Marginal tax rate", defaultValue: 20, suffix: "%" },
    ],
    assumptions: ["Uses a simplified RMF cap of 30% of income and combined retirement cap of ฿500,000.", "Tax savings use the marginal rate you enter."],
    faq: [{ q: "Why use marginal rate?", a: "Additional deductions usually save tax at your highest active tax bracket." }],
  },
  {
    slug: "ssf-deduction-calculator",
    title: "SSF Deduction Calculator",
    description: "Calculate SSF room and estimated tax savings.",
    category: "Thai Tax",
    fields: [
      { key: "income", label: "Annual income", defaultValue: 900000 },
      { key: "current", label: "Current SSF contribution", defaultValue: 30000 },
      { key: "rate", label: "Marginal tax rate", defaultValue: 15, suffix: "%" },
    ],
    assumptions: ["Uses a simplified SSF cap of 30% of income and maximum ฿200,000.", "Actual eligibility can vary by tax year."],
    faq: [{ q: "Is SSF separate from RMF?", a: "SSF has its own product limit but contributes to broader retirement deduction planning." }],
  },
  {
    slug: "thai-esg-deduction-calculator",
    title: "Thai ESG Deduction Calculator",
    description: "Estimate Thai ESG contribution room and tax savings.",
    category: "Thai Tax",
    fields: [
      { key: "income", label: "Annual income", defaultValue: 1000000 },
      { key: "current", label: "Current Thai ESG contribution", defaultValue: 20000 },
      { key: "rate", label: "Marginal tax rate", defaultValue: 20, suffix: "%" },
    ],
    assumptions: ["Uses a simplified Thai ESG cap of 30% of income and maximum ฿300,000.", "Check current Revenue Department rules before filing."],
    faq: [{ q: "What is Thai ESG useful for?", a: "It can combine long-term investing with tax planning when it fits your risk profile." }],
  },
  {
    slug: "emergency-fund-calculator",
    title: "Emergency Fund Calculator",
    description: "Find how much emergency cash you need based on monthly expenses.",
    category: "Safety",
    fields: [
      { key: "expenses", label: "Monthly essential expenses", defaultValue: 45000 },
      { key: "months", label: "Months of coverage", defaultValue: 6 },
      { key: "saved", label: "Already saved", defaultValue: 120000 },
    ],
    assumptions: ["A common target is 3 to 6 months of essential expenses.", "Use higher months for irregular income."],
    faq: [{ q: "Should debt payments be included?", a: "Yes, include required payments you must keep making during an emergency." }],
  },
  {
    slug: "savings-goal-calculator",
    title: "Savings Goal Calculator",
    description: "Calculate the monthly saving needed to reach a future goal.",
    category: "Goals",
    fields: [
      { key: "target", label: "Goal target", defaultValue: 1000000 },
      { key: "saved", label: "Already saved", defaultValue: 150000 },
      { key: "months", label: "Months until goal", defaultValue: 36 },
    ],
    assumptions: ["Ignores investment returns for a conservative monthly target.", "Use Atlas goals to track progress automatically."],
    faq: [{ q: "What if I invest the savings?", a: "Your required monthly amount may be lower, but market returns are not guaranteed." }],
  },
  {
    slug: "debt-avalanche-calculator",
    title: "Debt Avalanche Calculator",
    description: "Estimate payoff using the highest-interest-first method.",
    category: "Debt",
    fields: [
      { key: "balance", label: "Total debt balance", defaultValue: 300000 },
      { key: "rate", label: "Average APR", defaultValue: 18, suffix: "%" },
      { key: "payment", label: "Monthly payment", defaultValue: 18000 },
    ],
    assumptions: ["Uses one blended APR for a fast estimate.", "Real avalanche plans sort each debt by APR."],
    faq: [{ q: "Why avalanche?", a: "It usually minimizes interest by paying the highest-rate debt first." }],
  },
  {
    slug: "debt-snowball-calculator",
    title: "Debt Snowball Calculator",
    description: "Estimate payoff using a motivation-first fixed payment plan.",
    category: "Debt",
    fields: [
      { key: "balance", label: "Total debt balance", defaultValue: 180000 },
      { key: "rate", label: "Average APR", defaultValue: 16, suffix: "%" },
      { key: "payment", label: "Monthly payment", defaultValue: 12000 },
    ],
    assumptions: ["Uses one blended APR for a quick public estimate.", "Snowball prioritizes smallest balances in a full plan."],
    faq: [{ q: "Is snowball cheaper than avalanche?", a: "Usually no, but some people stick with it better because wins come sooner." }],
  },
  {
    slug: "credit-card-payoff-calculator",
    title: "Credit Card Payoff Calculator",
    description: "Estimate how long it takes to clear credit card debt.",
    category: "Debt",
    fields: [
      { key: "balance", label: "Card balance", defaultValue: 85000 },
      { key: "rate", label: "APR", defaultValue: 20, suffix: "%" },
      { key: "payment", label: "Monthly payment", defaultValue: 7000 },
    ],
    assumptions: ["Assumes no new card spending.", "Interest compounds monthly for estimate purposes."],
    faq: [{ q: "What payment should I use?", a: "Use the amount you can reliably pay every month above the minimum." }],
  },
  {
    slug: "mortgage-affordability-calculator",
    title: "Mortgage Affordability Calculator",
    description: "Estimate an affordable home loan from income and debt ratio.",
    category: "Loans",
    fields: [
      { key: "income", label: "Monthly income", defaultValue: 120000 },
      { key: "dti", label: "Target debt-to-income", defaultValue: 35, suffix: "%" },
      { key: "years", label: "Loan term years", defaultValue: 30 },
      { key: "rate", label: "Interest rate", defaultValue: 4.5, suffix: "%" },
    ],
    assumptions: ["Uses target DTI as the maximum monthly mortgage payment.", "Does not include taxes, insurance, or transfer fees."],
    faq: [{ q: "Is this bank approval?", a: "No, it is a planning estimate before talking to lenders." }],
  },
  {
    slug: "car-loan-calculator",
    title: "Car Loan Calculator",
    description: "Estimate monthly car payments and total interest.",
    category: "Loans",
    fields: [
      { key: "price", label: "Car price", defaultValue: 900000 },
      { key: "down", label: "Down payment", defaultValue: 180000 },
      { key: "rate", label: "Interest rate", defaultValue: 3.5, suffix: "%" },
      { key: "months", label: "Loan months", defaultValue: 60 },
    ],
    assumptions: ["Uses amortized monthly payment estimate.", "Thai auto loans may quote flat rates differently."],
    faq: [{ q: "Should I include insurance?", a: "Use Atlas budgets to include insurance, fuel, maintenance, and registration." }],
  },
  {
    slug: "compound-interest-calculator",
    title: "Compound Interest Calculator",
    description: "Project growth from starting balance, monthly contribution, and return.",
    category: "Investing",
    fields: [
      { key: "principal", label: "Starting amount", defaultValue: 100000 },
      { key: "monthly", label: "Monthly contribution", defaultValue: 10000 },
      { key: "rate", label: "Annual return", defaultValue: 6, suffix: "%" },
      { key: "years", label: "Years", defaultValue: 10 },
    ],
    assumptions: ["Returns are hypothetical and compounded monthly.", "Does not include tax, fees, or volatility."],
    faq: [{ q: "Is the return guaranteed?", a: "No. It is only a planning assumption." }],
  },
  {
    slug: "retirement-savings-calculator",
    title: "Retirement Savings Calculator",
    description: "Estimate retirement savings gap and monthly contribution required.",
    category: "Investing",
    fields: [
      { key: "target", label: "Retirement target", defaultValue: 15000000 },
      { key: "saved", label: "Already invested", defaultValue: 1200000 },
      { key: "years", label: "Years to retirement", defaultValue: 25 },
      { key: "rate", label: "Annual return", defaultValue: 6, suffix: "%" },
    ],
    assumptions: ["Compounds monthly with a constant return assumption.", "Does not model inflation-adjusted spending."],
    faq: [{ q: "How should I choose the target?", a: "Start from expected annual spending multiplied by the years or withdrawal rule you prefer." }],
  },
  {
    slug: "net-worth-calculator",
    title: "Net Worth Calculator",
    description: "Calculate assets minus liabilities and see your wealth baseline.",
    category: "Wealth",
    fields: [
      { key: "assets", label: "Total assets", defaultValue: 2500000 },
      { key: "liabilities", label: "Total liabilities", defaultValue: 750000 },
    ],
    assumptions: ["Net worth equals assets minus liabilities.", "Use current market values where possible."],
    faq: [{ q: "How often should I update it?", a: "Monthly is enough for most households." }],
  },
  {
    slug: "budget-planner-calculator",
    title: "Budget Planner Calculator",
    description: "Split monthly income into needs, wants, savings, and debt payoff.",
    category: "Budgeting",
    fields: [
      { key: "income", label: "Monthly income", defaultValue: 90000 },
      { key: "needs", label: "Needs percentage", defaultValue: 50, suffix: "%" },
      { key: "wants", label: "Wants percentage", defaultValue: 30, suffix: "%" },
      { key: "savings", label: "Savings percentage", defaultValue: 20, suffix: "%" },
    ],
    assumptions: ["Starts from a 50/30/20 style budget.", "Adjust percentages to fit Bangkok or family costs."],
    faq: [{ q: "What if percentages exceed 100?", a: "The calculator still shows each bucket so you can rebalance." }],
  },
  {
    slug: "inflation-impact-calculator",
    title: "Inflation Impact Calculator",
    description: "Estimate how inflation reduces purchasing power over time.",
    category: "Planning",
    fields: [
      { key: "amount", label: "Today's amount", defaultValue: 100000 },
      { key: "rate", label: "Annual inflation", defaultValue: 3, suffix: "%" },
      { key: "years", label: "Years", defaultValue: 10 },
    ],
    assumptions: ["Uses annual compounding.", "Actual inflation varies by lifestyle and category."],
    faq: [{ q: "Why does this matter?", a: "Long-term goals should account for future prices, not only today's cost." }],
  },
  {
    slug: "financial-health-score-calculator",
    title: "Financial Health Score Calculator",
    description: "Estimate a financial health score from savings, debt, and emergency fund coverage.",
    category: "Health",
    fields: [
      { key: "savingsRate", label: "Savings rate", defaultValue: 20, suffix: "%" },
      { key: "debtRatio", label: "Debt-to-income", defaultValue: 25, suffix: "%" },
      { key: "emergencyMonths", label: "Emergency fund months", defaultValue: 4 },
    ],
    assumptions: ["Score weights savings, debt, and emergency coverage.", "Atlas app gives a richer score using real account data."],
    faq: [{ q: "What is a good score?", a: "Above 80 suggests strong habits; below 60 usually means one area needs attention." }],
  },
];

const taxForThailand = (taxableIncome: number) => {
  const brackets = [
    { min: 0, max: 150000, rate: 0 },
    { min: 150000, max: 300000, rate: 0.05 },
    { min: 300000, max: 500000, rate: 0.1 },
    { min: 500000, max: 750000, rate: 0.15 },
    { min: 750000, max: 1000000, rate: 0.2 },
    { min: 1000000, max: 2000000, rate: 0.25 },
    { min: 2000000, max: 5000000, rate: 0.3 },
    { min: 5000000, max: Infinity, rate: 0.35 },
  ];

  return brackets.reduce((tax, bracket) => {
    if (taxableIncome <= bracket.min) return tax;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    return tax + taxableInBracket * bracket.rate;
  }, 0);
};

const monthlyPayment = (principal: number, annualRate: number, months: number) => {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

const calculateResult = (slug: string, values: Record<string, number>) => {
  const monthlyRate = (values.rate || 0) / 100 / 12;

  if (slug === "thai-income-tax-calculator") {
    const taxableIncome = Math.max(0, values.income - values.deductions - values.allowance);
    const tax = taxForThailand(taxableIncome);
    return [
      { label: "Taxable income", value: formatTHB(taxableIncome) },
      { label: "Estimated tax", value: formatTHB(tax) },
      { label: "Effective tax rate", value: values.income > 0 ? formatPercent((tax / values.income) * 100) : "0.00%" },
    ];
  }

  if (["rmf-deduction-calculator", "ssf-deduction-calculator", "thai-esg-deduction-calculator"].includes(slug)) {
    const maxBySlug = slug === "ssf-deduction-calculator" ? 200000 : slug === "thai-esg-deduction-calculator" ? 300000 : 500000;
    const cap = Math.min(values.income * 0.3, maxBySlug);
    const room = Math.max(0, cap - values.current);
    return [
      { label: "Estimated contribution cap", value: formatTHB(cap) },
      { label: "Remaining room", value: formatTHB(room) },
      { label: "Estimated tax saving", value: formatTHB(room * (values.rate / 100)) },
    ];
  }

  if (slug === "emergency-fund-calculator") {
    const target = values.expenses * values.months;
    return [
      { label: "Emergency fund target", value: formatTHB(target) },
      { label: "Still needed", value: formatTHB(target - values.saved) },
      { label: "Coverage saved", value: `${values.expenses > 0 ? (values.saved / values.expenses).toFixed(1) : "0.0"} months` },
    ];
  }

  if (slug === "savings-goal-calculator") {
    const remaining = Math.max(0, values.target - values.saved);
    return [
      { label: "Remaining goal", value: formatTHB(remaining) },
      { label: "Required monthly saving", value: formatTHB(remaining / Math.max(1, values.months)) },
      { label: "Progress", value: values.target > 0 ? formatPercent((values.saved / values.target) * 100) : "0.00%" },
    ];
  }

  if (["debt-avalanche-calculator", "debt-snowball-calculator", "credit-card-payoff-calculator"].includes(slug)) {
    const interest = values.balance * monthlyRate;
    const principalPayment = Math.max(0, values.payment - interest);
    const months = principalPayment > 0 ? Math.ceil(values.balance / principalPayment) : Infinity;
    return [
      { label: "Estimated payoff time", value: Number.isFinite(months) ? `${months} months` : "Payment too low" },
      { label: "First-month interest", value: formatTHB(interest) },
      { label: "First-month principal", value: formatTHB(principalPayment) },
    ];
  }

  if (slug === "mortgage-affordability-calculator") {
    const maxPayment = values.income * (values.dti / 100);
    const months = values.years * 12;
    const loan = monthlyRate > 0
      ? maxPayment * (Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months))
      : maxPayment * months;
    return [
      { label: "Max monthly payment", value: formatTHB(maxPayment) },
      { label: "Estimated loan size", value: formatTHB(loan) },
      { label: "Planning DTI", value: formatPercent(values.dti) },
    ];
  }

  if (slug === "car-loan-calculator") {
    const principal = Math.max(0, values.price - values.down);
    const payment = monthlyPayment(principal, values.rate, values.months);
    return [
      { label: "Loan principal", value: formatTHB(principal) },
      { label: "Monthly payment", value: formatTHB(payment) },
      { label: "Total interest", value: formatTHB(payment * values.months - principal) },
    ];
  }

  if (slug === "compound-interest-calculator") {
    const months = values.years * 12;
    const futureValue = Array.from({ length: months }).reduce<number>((balance) => (balance + values.monthly) * (1 + monthlyRate), values.principal);
    return [
      { label: "Projected value", value: formatTHB(futureValue) },
      { label: "Total contributions", value: formatTHB(values.principal + values.monthly * months) },
      { label: "Estimated growth", value: formatTHB(futureValue - values.principal - values.monthly * months) },
    ];
  }

  if (slug === "retirement-savings-calculator") {
    const months = values.years * 12;
    const futureSaved = values.saved * Math.pow(1 + monthlyRate, months);
    const needed = Math.max(0, values.target - futureSaved);
    const requiredMonthly = monthlyRate > 0
      ? needed * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)
      : needed / Math.max(1, months);
    return [
      { label: "Future value of current savings", value: formatTHB(futureSaved) },
      { label: "Remaining future gap", value: formatTHB(needed) },
      { label: "Required monthly contribution", value: formatTHB(requiredMonthly) },
    ];
  }

  if (slug === "net-worth-calculator") {
    return [
      { label: "Net worth", value: formatTHB(values.assets - values.liabilities) },
      { label: "Assets", value: formatTHB(values.assets) },
      { label: "Liabilities", value: formatTHB(values.liabilities) },
    ];
  }

  if (slug === "budget-planner-calculator") {
    return [
      { label: "Needs budget", value: formatTHB(values.income * values.needs / 100) },
      { label: "Wants budget", value: formatTHB(values.income * values.wants / 100) },
      { label: "Savings budget", value: formatTHB(values.income * values.savings / 100) },
    ];
  }

  if (slug === "inflation-impact-calculator") {
    const futureCost = values.amount * Math.pow(1 + values.rate / 100, values.years);
    return [
      { label: "Future cost", value: formatTHB(futureCost) },
      { label: "Purchasing-power loss", value: formatTHB(futureCost - values.amount) },
      { label: "Inflation assumption", value: formatPercent(values.rate) },
    ];
  }

  if (slug === "financial-health-score-calculator") {
    const score = Math.min(100, Math.max(0, values.savingsRate * 2 + (50 - values.debtRatio) + values.emergencyMonths * 8));
    return [
      { label: "Estimated score", value: `${Math.round(score)}/100` },
      { label: "Savings signal", value: values.savingsRate >= 20 ? "Strong" : "Needs work" },
      { label: "Debt signal", value: values.debtRatio <= 35 ? "Healthy" : "High" },
    ];
  }

  return [];
};

export default function PublicCalculators() {
  const { slug } = useParams();
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const calculator = calculators.find(item => item.slug === slug);
  const [valuesBySlug, setValuesBySlug] = useState<Record<string, Record<string, number>>>({});

  const values = useMemo(() => {
    if (!calculator) return {};
    return calculator.fields.reduce<Record<string, number>>((acc, field) => {
      const queryValue = searchParams.get(field.key);
      acc[field.key] = valuesBySlug[calculator.slug]?.[field.key] ?? (queryValue ? Number(queryValue) : field.defaultValue);
      return acc;
    }, {});
  }, [calculator, searchParams, valuesBySlug]);

  if (!calculator) {
    return (
      <main className="min-h-screen bg-background">
        <SEO
          title="Personal Finance Calculator Library"
          description="Free Thai personal finance calculators for tax, debt, savings, investing, budgeting, and financial health."
          canonical="/calculators"
          keywords="Thai finance calculators, tax calculator Thailand, debt payoff calculator, savings calculator"
        />
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-normal">Personal Finance Calculator Library</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Free calculators built for Thailand-based planning, from Thai tax deductions to debt payoff and savings goals.
              </p>
            </div>
            <Button asChild>
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Save in Atlas
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {calculators.map((item) => (
              <Card key={item.slug}>
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    <Calculator className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/calculators/${item.slug}`}>Open calculator</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const results = calculateResult(calculator.slug, values);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: calculator.title,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: calculator.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
    mainEntity: calculator.faq.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const updateValue = (key: string, value: number) => {
    setValuesBySlug(prev => ({
      ...prev,
      [calculator.slug]: {
        ...(prev[calculator.slug] || {}),
        [key]: value,
      },
    }));
  };

  const copyResult = async () => {
    const resultText = `${calculator.title}: ${results.map(item => `${item.label} ${item.value}`).join(", ")}`;
    await navigator.clipboard.writeText(resultText);
    toast.success("Result copied");
  };

  const getShareUrl = () => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => params.set(key, String(value)));
    return `${window.location.origin}/calculators/${calculator.slug}?${params.toString()}`;
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    toast.success("Private result link copied");
  };

  const downloadResultImage = async () => {
    if (!resultCardRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(resultCardRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${calculator.slug}-result.png`;
    link.click();
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={calculator.title}
        description={calculator.description}
        canonical={`/calculators/${calculator.slug}`}
        keywords={`${calculator.title}, Thai personal finance, Atlas finance calculator`}
        structuredData={structuredData}
      />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <Button asChild variant="ghost" className="px-0">
            <Link to="/calculators">All calculators</Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <Badge variant="secondary">{calculator.category}</Badge>
            <h1 className="mt-3 text-4xl font-bold tracking-normal">{calculator.title}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{calculator.description}</p>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Calculator Inputs</CardTitle>
                <CardDescription>Adjust the values to create a shareable estimate.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {calculator.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={field.key}
                        type="number"
                        value={values[field.key] ?? ""}
                        onChange={(event) => updateValue(field.key, Number(event.target.value) || 0)}
                      />
                      {field.suffix && <span className="text-sm text-muted-foreground">{field.suffix}</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {calculator.assumptions.map((assumption) => (
                  <p key={assumption} className="text-sm text-muted-foreground">{assumption}</p>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculator.faq.map((item) => (
                  <div key={item.q}>
                    <p className="font-medium">{item.q}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="sticky top-6" ref={resultCardRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Result Card
                </CardTitle>
                <CardDescription>Save or share this estimate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.map((result) => (
                  <div key={result.label} className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{result.label}</p>
                    <p className="mt-1 text-2xl font-bold">{result.value}</p>
                  </div>
                ))}
                <div className="grid gap-2">
                  <Button asChild>
                    <Link to="/login">
                      <Save className="mr-2 h-4 w-4" />
                      Save result in Atlas
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={copyResult}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy share card
                  </Button>
                  <Button variant="outline" onClick={copyShareLink}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy private link
                  </Button>
                  <Button variant="outline" onClick={downloadResultImage}>
                    <Download className="mr-2 h-4 w-4" />
                    Download result image
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Workflows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link className="block text-primary hover:underline" to="/login">Create your free Atlas account</Link>
                <Link className="block text-primary hover:underline" to="/login">Track this number in your dashboard</Link>
                <Link className="block text-primary hover:underline" to="/login">Turn this estimate into a monthly plan</Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
