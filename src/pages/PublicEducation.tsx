import { Link, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, Calculator } from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Topic = {
  slug: string;
  title: string;
  description: string;
  category: string;
  definition: string;
  formula: string;
  benchmark: string;
  calculatorPath: string;
  workflowPath: string;
  actions: string[];
};

const topics: Topic[] = [
  {
    slug: "savings-rate",
    title: "Savings Rate",
    description: "Learn how savings rate shows whether your income is turning into future wealth.",
    category: "Budgeting",
    definition: "Savings rate is the share of income you keep after spending.",
    formula: "Monthly savings / monthly income x 100",
    benchmark: "A 20%+ savings rate is strong for many households.",
    calculatorPath: "/calculators/budget-planner-calculator",
    workflowPath: "/login",
    actions: ["Automate savings after payday.", "Separate true savings from annual bills.", "Review lifestyle inflation every month."],
  },
  {
    slug: "debt-to-income-ratio",
    title: "Debt-to-Income Ratio",
    description: "Understand how much of your income goes to debt payments.",
    category: "Debt",
    definition: "Debt-to-income ratio compares monthly debt payments to monthly income.",
    formula: "Monthly debt payments / monthly income x 100",
    benchmark: "Below 35% is often healthier; lower is better before taking new loans.",
    calculatorPath: "/calculators/mortgage-affordability-calculator",
    workflowPath: "/login",
    actions: ["Avoid new debt when the ratio is high.", "Use extra payments on high-interest balances.", "Check this before a mortgage or car loan."],
  },
  {
    slug: "credit-utilization",
    title: "Credit Utilization",
    description: "Track credit card balance usage so debt does not quietly become expensive.",
    category: "Credit",
    definition: "Credit utilization is the percentage of available card limit currently used.",
    formula: "Card balance / credit limit x 100",
    benchmark: "Under 30% is a useful planning target.",
    calculatorPath: "/calculators/credit-card-payoff-calculator",
    workflowPath: "/login",
    actions: ["Pay before the statement date when possible.", "Stop new spending during payoff periods.", "Track all cards in one place."],
  },
  {
    slug: "emergency-fund",
    title: "Emergency Fund",
    description: "Build cash reserves for job loss, medical costs, family needs, and surprise bills.",
    category: "Safety",
    definition: "An emergency fund is cash reserved for necessary expenses during disruption.",
    formula: "Essential monthly expenses x target months",
    benchmark: "Three to six months is common; freelancers may need more.",
    calculatorPath: "/calculators/emergency-fund-calculator",
    workflowPath: "/login",
    actions: ["Keep it separate from spending accounts.", "Fund it before aggressive investing.", "Recalculate after rent, family, or job changes."],
  },
  {
    slug: "rmf",
    title: "RMF",
    description: "Use Retirement Mutual Funds as part of long-term Thai tax and retirement planning.",
    category: "Thai Tax",
    definition: "RMF is a retirement-oriented mutual fund category with tax deduction benefits when rules are met.",
    formula: "Contribution room depends on income, product rules, and combined caps.",
    benchmark: "Use RMF when the holding rules fit your retirement plan.",
    calculatorPath: "/calculators/rmf-deduction-calculator",
    workflowPath: "/login",
    actions: ["Confirm current-year rules before buying.", "Avoid buying only for tax savings.", "Track this-year contributions."],
  },
  {
    slug: "ssf",
    title: "SSF",
    description: "Understand Super Savings Funds and how they fit tax-aware investing.",
    category: "Thai Tax",
    definition: "SSF is a tax-advantaged fund type for medium to long-term investing under Thai rules.",
    formula: "Deduction room is based on income percentage and product caps.",
    benchmark: "Useful when your horizon matches the required holding period.",
    calculatorPath: "/calculators/ssf-deduction-calculator",
    workflowPath: "/login",
    actions: ["Compare fund risk before buying.", "Track purchase dates.", "Coordinate with RMF and Thai ESG room."],
  },
  {
    slug: "thai-esg",
    title: "Thai ESG",
    description: "Plan Thai ESG contributions with tax savings and concentration risk in mind.",
    category: "Thai Tax",
    definition: "Thai ESG funds support eligible Thai ESG investments and may provide tax deductions.",
    formula: "Tax saving is contribution amount x marginal tax rate, subject to caps.",
    benchmark: "Best when tax benefit and portfolio allocation both make sense.",
    calculatorPath: "/calculators/thai-esg-deduction-calculator",
    workflowPath: "/login",
    actions: ["Check eligible fund exposure.", "Avoid overconcentration.", "Review alongside total Thai equity allocation."],
  },
  {
    slug: "net-worth",
    title: "Net Worth",
    description: "Use net worth as the big-picture scorecard for financial progress.",
    category: "Wealth",
    definition: "Net worth is what you own minus what you owe.",
    formula: "Assets - liabilities",
    benchmark: "The trend matters more than one monthly number.",
    calculatorPath: "/calculators/net-worth-calculator",
    workflowPath: "/login",
    actions: ["Update monthly.", "Use realistic asset values.", "Separate net worth growth from investment volatility."],
  },
  {
    slug: "cash-flow",
    title: "Cash Flow",
    description: "See whether money coming in reliably covers spending, debt, and goals.",
    category: "Planning",
    definition: "Cash flow is income minus expenses over a period.",
    formula: "Income - expenses",
    benchmark: "Positive monthly cash flow gives you options.",
    calculatorPath: "/calculators/budget-planner-calculator",
    workflowPath: "/login",
    actions: ["Forecast bills before payday.", "Plan irregular annual expenses.", "Simulate large purchases before committing."],
  },
  {
    slug: "sinking-funds",
    title: "Sinking Funds",
    description: "Prepare for predictable future expenses without disturbing emergency cash.",
    category: "Budgeting",
    definition: "A sinking fund is money set aside over time for a known future expense.",
    formula: "Future cost / months remaining",
    benchmark: "Use sinking funds for insurance, travel, school fees, repairs, and tax bills.",
    calculatorPath: "/calculators/savings-goal-calculator",
    workflowPath: "/login",
    actions: ["Create one goal per major expense.", "Automate monthly transfers.", "Do not mix sinking funds with emergency funds."],
  },
  {
    slug: "compound-interest",
    title: "Compound Interest",
    description: "Understand how time, contributions, and returns can grow long-term savings.",
    category: "Investing",
    definition: "Compound interest means returns can earn returns over time.",
    formula: "Future value grows with principal, contribution, return, and time.",
    benchmark: "Starting earlier often matters more than chasing high returns.",
    calculatorPath: "/calculators/compound-interest-calculator",
    workflowPath: "/login",
    actions: ["Invest consistently.", "Keep fees low.", "Use realistic return assumptions."],
  },
];

export default function PublicEducation() {
  const { slug } = useParams();
  const topic = topics.find(item => item.slug === slug);

  if (!topic) {
    return (
      <main className="min-h-screen bg-background">
        <SEO title="Finance Education Hub" description="Plain-English personal finance lessons linked to calculators and Atlas workflows." canonical="/learn" />
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-bold tracking-normal">Finance Education Hub</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Learn the core metrics and decisions behind better money management.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map(item => (
              <Card key={item.slug}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{item.category}</Badge>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/learn/${item.slug}`}>Read lesson</Link>
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
        title={topic.title}
        description={topic.description}
        canonical={`/learn/${topic.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: topic.title,
          description: topic.description,
          educationalLevel: "Beginner",
        }}
      />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" className="mb-6 px-0">
          <Link to="/learn">All lessons</Link>
        </Button>
        <Badge variant="secondary">{topic.category}</Badge>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">{topic.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{topic.description}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  What It Means
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Definition</p>
                  <p className="mt-1 font-medium">{topic.definition}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Formula</p>
                  <p className="mt-1 font-medium">{topic.formula}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Benchmark</p>
                  <p className="mt-1 font-medium">{topic.benchmark}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What To Do Next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topic.actions.map(action => (
                  <div key={action} className="flex gap-3 rounded-lg border p-4">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">{action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Practice With Your Numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full">
                  <Link to={topic.calculatorPath}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Open calculator
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={topic.workflowPath}>Track in Atlas</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}
