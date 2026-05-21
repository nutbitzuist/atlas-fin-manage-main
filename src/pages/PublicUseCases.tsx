import { Link, useParams } from "react-router-dom";
import { Calculator, MapPin, Wallet } from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UseCasePage = {
  slug: string;
  title: string;
  description: string;
  city: string;
  monthlyBudget: Array<{ category: string; amount: number; note: string }>;
  assumptions: string[];
  calculatorPath: string;
};

const formatTHB = (value: number) => `฿${value.toLocaleString()}`;

const pages: UseCasePage[] = [
  {
    slug: "bangkok-cost-of-living-budget-planner",
    title: "Bangkok Cost-of-Living Budget Planner",
    description: "Plan a Bangkok monthly budget with rent, transit, food, insurance, and savings assumptions.",
    city: "Bangkok",
    calculatorPath: "/calculators/budget-planner-calculator",
    monthlyBudget: [
      { category: "Rent or mortgage", amount: 28000, note: "Central condo or shared household baseline" },
      { category: "Food and groceries", amount: 18000, note: "Mixed home cooking, delivery, and eating out" },
      { category: "Transport", amount: 5500, note: "BTS/MRT, taxi, and occasional ride-hailing" },
      { category: "Utilities and phone", amount: 4500, note: "Electricity varies heavily with air conditioning" },
      { category: "Insurance and health", amount: 5000, note: "Premium sinking fund and routine care" },
      { category: "Savings and investing", amount: 20000, note: "Target transfer before lifestyle spending" },
    ],
    assumptions: ["Designed for a single professional or couple without school fees.", "Central rent can vary widely by BTS/MRT distance.", "Use after-tax income for monthly budget planning."],
  },
  {
    slug: "chiang-mai-monthly-budget-template",
    title: "Chiang Mai Monthly Budget Template",
    description: "Build a Chiang Mai monthly spending plan with lower housing assumptions and flexible lifestyle costs.",
    city: "Chiang Mai",
    calculatorPath: "/calculators/budget-planner-calculator",
    monthlyBudget: [
      { category: "Rent or mortgage", amount: 14000, note: "Apartment or house outside premium tourist zones" },
      { category: "Food and groceries", amount: 13000, note: "Local meals, groceries, and cafes" },
      { category: "Transport", amount: 4500, note: "Fuel, rides, or scooter/car costs" },
      { category: "Utilities and phone", amount: 3500, note: "Seasonal electricity changes" },
      { category: "Insurance and health", amount: 4500, note: "Health protection and routine care" },
      { category: "Savings and investing", amount: 15000, note: "Automated monthly target" },
    ],
    assumptions: ["Useful for remote workers, families, or retirees adjusting from Bangkok costs.", "Transport assumes less rail access and more personal vehicle use.", "Lifestyle costs vary during high season."],
  },
  {
    slug: "emergency-fund-calculator-for-bangkok-expenses",
    title: "Emergency Fund Calculator for Bangkok Expenses",
    description: "Estimate a Bangkok emergency fund using essential expense categories and job-risk buffers.",
    city: "Bangkok",
    calculatorPath: "/calculators/emergency-fund-calculator",
    monthlyBudget: [
      { category: "Essential housing", amount: 25000, note: "Rent or mortgage that must continue" },
      { category: "Essential food", amount: 12000, note: "Groceries and basic meals" },
      { category: "Transport", amount: 4000, note: "Commute and family logistics" },
      { category: "Insurance", amount: 5000, note: "Keep protection active during income disruption" },
      { category: "Debt minimums", amount: 8000, note: "Minimum required debt payments" },
      { category: "Utilities", amount: 4000, note: "Electricity, water, phone, internet" },
    ],
    assumptions: ["Uses essential expenses only, not normal lifestyle spending.", "Six months is a balanced target for Bangkok salaried households.", "Freelancers may prefer nine to twelve months."],
  },
];

export default function PublicUseCases() {
  const { slug } = useParams();
  const page = pages.find(item => item.slug === slug);

  if (!page) {
    return (
      <main className="min-h-screen bg-background">
        <SEO title="Local Finance Planning Templates" description="Location and use-case based budget planning pages for Thailand." canonical="/use-cases" />
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-bold tracking-normal">Local Finance Planning Templates</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Budget and emergency fund pages with local assumptions and calculator links.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pages.map(item => (
              <Card key={item.slug}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{item.city}</Badge>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/use-cases/${item.slug}`}>Open template</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const monthlyTotal = page.monthlyBudget.reduce((sum, item) => sum + item.amount, 0);
  const sixMonthEmergencyFund = monthlyTotal * 6;

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={page.title}
        description={page.description}
        canonical={`/use-cases/${page.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: page.title,
          description: page.description,
          supply: page.monthlyBudget.map(item => item.category),
        }}
      />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" className="mb-6 px-0">
          <Link to="/use-cases">All use cases</Link>
        </Button>
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3 w-3" />
          {page.city}
        </Badge>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">{page.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{page.description}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Monthly Budget Assumptions
                </CardTitle>
                <CardDescription>Use these as starter assumptions, then customize them in Atlas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {page.monthlyBudget.map(item => (
                  <div key={item.category} className="grid gap-2 rounded-lg border p-4 md:grid-cols-[1fr_140px] md:items-center">
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.note}</p>
                    </div>
                    <p className="text-xl font-bold md:text-right">{formatTHB(item.amount)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Local Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {page.assumptions.map(item => (
                  <p key={item} className="text-sm text-muted-foreground">{item}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planning Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Monthly baseline</p>
                  <p className="mt-1 text-2xl font-bold">{formatTHB(monthlyTotal)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">6-month emergency fund</p>
                  <p className="mt-1 text-2xl font-bold">{formatTHB(sixMonthEmergencyFund)}</p>
                </div>
                <Button asChild className="w-full">
                  <Link to={page.calculatorPath}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Adjust calculator
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Recreate in Atlas</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
