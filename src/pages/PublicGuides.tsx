import { Link, useParams } from "react-router-dom";
import { ArrowRight, Calculator, CheckCircle, Scale } from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Guide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  calculatorPath: string;
  workflowPath: string;
  example: Array<{ label: string; value: string }>;
  comparison: Array<{ option: string; bestFor: string; watchOut: string }>;
  takeaways: string[];
};

const guides: Guide[] = [
  {
    slug: "rmf-vs-ssf-vs-thai-esg",
    title: "RMF vs SSF vs Thai ESG",
    description: "Compare Thailand tax-saving funds by use case, limits, and planning tradeoffs.",
    category: "Thai Tax",
    calculatorPath: "/calculators/rmf-deduction-calculator",
    workflowPath: "/login",
    example: [
      { label: "Income example", value: "฿1,200,000/year" },
      { label: "Marginal tax rate", value: "20%" },
      { label: "฿100,000 contribution saving", value: "About ฿20,000" },
    ],
    comparison: [
      { option: "RMF", bestFor: "Retirement-first investing", watchOut: "Long holding rules and retirement conditions" },
      { option: "SSF", bestFor: "Medium to long-term tax planning", watchOut: "Fund-specific risk and holding period" },
      { option: "Thai ESG", bestFor: "Tax planning with Thai ESG exposure", watchOut: "Concentration in eligible Thai assets" },
    ],
    takeaways: ["Start with your time horizon, not only the tax saving.", "Do not fill tax funds before emergency cash is stable.", "Track yearly contributions so you avoid overbuying near year-end."],
  },
  {
    slug: "debt-snowball-vs-avalanche",
    title: "Debt Snowball vs Avalanche",
    description: "Choose between motivation-first and interest-minimizing debt payoff strategies.",
    category: "Debt",
    calculatorPath: "/calculators/debt-avalanche-calculator",
    workflowPath: "/login",
    example: [
      { label: "Debt example", value: "฿300,000" },
      { label: "Average APR", value: "18%" },
      { label: "Monthly payoff budget", value: "฿18,000" },
    ],
    comparison: [
      { option: "Avalanche", bestFor: "Lowest total interest", watchOut: "First payoff win may take longer" },
      { option: "Snowball", bestFor: "Motivation and momentum", watchOut: "Can cost more interest" },
      { option: "Hybrid", bestFor: "Users who need both math and motivation", watchOut: "Requires regular review" },
    ],
    takeaways: ["Avalanche is usually mathematically best.", "Snowball can be behaviorally best if it keeps you consistent.", "Atlas debt planner can simulate both with your real debts."],
  },
  {
    slug: "rent-vs-buy-bangkok",
    title: "Rent vs Buy in Bangkok",
    description: "Compare rent, mortgage affordability, ownership costs, and flexibility for Bangkok households.",
    category: "Housing",
    calculatorPath: "/calculators/mortgage-affordability-calculator",
    workflowPath: "/login",
    example: [
      { label: "Monthly income", value: "฿120,000" },
      { label: "Target DTI", value: "35%" },
      { label: "Planning mortgage budget", value: "About ฿42,000/month" },
    ],
    comparison: [
      { option: "Rent", bestFor: "Flexibility and lower upfront cash", watchOut: "No ownership upside" },
      { option: "Buy", bestFor: "Long stays and stable income", watchOut: "Maintenance, fees, transfer costs, and concentration risk" },
      { option: "Wait", bestFor: "Building down payment or income stability", watchOut: "Prices and rates can change" },
    ],
    takeaways: ["Compare total monthly ownership, not mortgage only.", "Keep an emergency fund after down payment.", "Use cash-flow scenarios before buying."],
  },
  {
    slug: "emergency-fund-by-income-level",
    title: "Emergency Fund by Income Level",
    description: "Estimate emergency fund targets for different income and expense levels.",
    category: "Safety",
    calculatorPath: "/calculators/emergency-fund-calculator",
    workflowPath: "/login",
    example: [
      { label: "Essential expenses", value: "฿45,000/month" },
      { label: "Target", value: "6 months" },
      { label: "Emergency fund", value: "฿270,000" },
    ],
    comparison: [
      { option: "3 months", bestFor: "Stable salary and low dependents", watchOut: "May be thin for job loss" },
      { option: "6 months", bestFor: "Most households", watchOut: "Takes longer to build" },
      { option: "9-12 months", bestFor: "Freelancers, business owners, dependents", watchOut: "Too much idle cash can slow investing" },
    ],
    takeaways: ["Base the target on essential expenses, not income.", "Separate emergency cash from travel or shopping savings.", "Automate monthly funding until target is reached."],
  },
  {
    slug: "how-much-to-save-monthly-for-1m",
    title: "How Much to Save Monthly for ฿1M",
    description: "See the monthly saving needed to reach one million baht over different timelines.",
    category: "Goals",
    calculatorPath: "/calculators/savings-goal-calculator",
    workflowPath: "/login",
    example: [
      { label: "Goal", value: "฿1,000,000" },
      { label: "Timeline", value: "36 months" },
      { label: "Monthly saving", value: "About ฿27,778" },
    ],
    comparison: [
      { option: "24 months", bestFor: "Aggressive savers", watchOut: "High monthly pressure" },
      { option: "36 months", bestFor: "Balanced planning", watchOut: "Needs consistent automation" },
      { option: "60 months", bestFor: "Lower monthly burden", watchOut: "Inflation may raise the real target" },
    ],
    takeaways: ["Shorter timelines require much higher monthly savings.", "Name the goal so it feels concrete.", "Track progress monthly and adjust after income changes."],
  },
];

export default function PublicGuides() {
  const { slug } = useParams();
  const guide = guides.find(item => item.slug === slug);

  if (!guide) {
    return (
      <main className="min-h-screen bg-background">
        <SEO title="Finance Comparison Guides" description="Comparison guides for Thai personal finance decisions." canonical="/guides" />
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-bold tracking-normal">Finance Comparison Guides</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Useful comparisons with calculator-backed examples and Atlas workflows.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guides.map(item => (
              <Card key={item.slug}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{item.category}</Badge>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/guides/${item.slug}`}>Read guide</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={guide.title}
        description={guide.description}
        canonical={`/guides/${guide.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          articleSection: guide.category,
        }}
      />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" className="mb-6 px-0">
          <Link to="/guides">All guides</Link>
        </Button>
        <Badge variant="secondary">{guide.category}</Badge>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">{guide.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{guide.description}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {guide.comparison.map(item => (
                  <div key={item.option} className="rounded-lg border p-4">
                    <p className="font-semibold">{item.option}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Best for: {item.bestFor}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Watch out: {item.watchOut}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calculator-Backed Example</CardTitle>
                <CardDescription>Use this as a quick planning baseline, then open the calculator to adjust values.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {guide.example.map(item => (
                  <div key={item.label} className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-xl font-bold">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Takeaways</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guide.takeaways.map(item => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Use the Calculator</CardTitle>
                <CardDescription>Adjust the example with your numbers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full">
                  <Link to={guide.calculatorPath}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Open calculator
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={guide.workflowPath}>
                    Continue in Atlas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
