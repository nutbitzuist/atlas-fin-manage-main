import { Link, useParams } from "react-router-dom";
import { Download, FileSpreadsheet, LogIn } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Template = {
  slug: string;
  title: string;
  description: string;
  category: string;
  columns: string[];
  rows: string[][];
  workflow: string;
};

const templates: Template[] = [
  {
    slug: "budget-spreadsheet",
    title: "Budget Spreadsheet Template",
    description: "Plan income, needs, wants, savings, and debt payments in a simple monthly sheet.",
    category: "Budgeting",
    workflow: "/login",
    columns: ["Month", "Income", "Needs", "Wants", "Savings", "Debt Payments", "Notes"],
    rows: [["2026-01", "90000", "42000", "18000", "20000", "10000", "Starter budget"]],
  },
  {
    slug: "thai-tax-checklist",
    title: "Thai Tax Checklist Template",
    description: "Track RMF, SSF, Thai ESG, insurance, donations, mortgage interest, and receipts.",
    category: "Thai Tax",
    workflow: "/login",
    columns: ["Deduction", "Limit", "Current Amount", "Receipt Ready", "Notes"],
    rows: [["RMF/SSF/Thai ESG", "500000", "0", "No", "Update before Dec 31"]],
  },
  {
    slug: "monthly-money-review-template",
    title: "Monthly Money Review Template",
    description: "Review net worth, cash flow, wins, risks, and next month actions.",
    category: "Review",
    workflow: "/login",
    columns: ["Month", "Net Worth", "Income", "Expenses", "Savings Rate", "Win", "Next Action"],
    rows: [["2026-01", "0", "0", "0", "0%", "Started tracking", "Set budget"]],
  },
  {
    slug: "debt-payoff-spreadsheet",
    title: "Debt Payoff Spreadsheet",
    description: "Track balances, APRs, minimums, extra payments, and payoff priority.",
    category: "Debt",
    workflow: "/login",
    columns: ["Debt", "Balance", "APR", "Minimum Payment", "Extra Payment", "Strategy", "Payoff Order"],
    rows: [["Credit Card", "85000", "20%", "3000", "4000", "Avalanche", "1"]],
  },
  {
    slug: "net-worth-tracker",
    title: "Net Worth Tracker",
    description: "Track assets, liabilities, and monthly net worth movement.",
    category: "Wealth",
    workflow: "/login",
    columns: ["Month", "Cash", "Investments", "Property", "Other Assets", "Liabilities", "Net Worth"],
    rows: [["2026-01", "0", "0", "0", "0", "0", "0"]],
  },
  {
    slug: "emergency-fund-tracker",
    title: "Emergency Fund Tracker",
    description: "Track emergency savings target, current amount, monthly contribution, and coverage months.",
    category: "Safety",
    workflow: "/login",
    columns: ["Month", "Essential Expenses", "Target Months", "Target Amount", "Saved", "Coverage Months"],
    rows: [["2026-01", "45000", "6", "270000", "0", "0"]],
  },
  {
    slug: "insurance-tracker",
    title: "Insurance Tracker",
    description: "Track policy coverage, premiums, renewal dates, beneficiaries, and tax-deductible status.",
    category: "Insurance",
    workflow: "/login",
    columns: ["Policy", "Type", "Coverage", "Annual Premium", "Renewal Date", "Beneficiaries", "Tax Deductible"],
    rows: [["Policy name", "Health", "1000000", "25000", "2026-12-31", "Name", "Yes"]],
  },
  {
    slug: "investment-tracker",
    title: "Investment Tracker",
    description: "Track cost basis, current value, allocation, return, and tax-advantaged holdings.",
    category: "Investing",
    workflow: "/login",
    columns: ["Investment", "Type", "Cost Basis", "Current Value", "Gain/Loss", "Allocation", "Tax Category"],
    rows: [["SET Index Fund", "Mutual Fund", "100000", "110000", "10000", "40%", "General"]],
  },
];

const toCsv = (template: Template) => [template.columns, ...template.rows]
  .map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(","))
  .join("\n");

export default function PublicTemplates() {
  const { slug } = useParams();
  const template = templates.find(item => item.slug === slug);

  const downloadTemplate = (item: Template) => {
    const blob = new Blob([toCsv(item)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  if (!template) {
    return (
      <main className="min-h-screen bg-background">
        <SEO title="Finance Template Library" description="Download personal finance templates or recreate them inside Atlas." canonical="/templates" />
        <section className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-4xl font-bold tracking-normal">Finance Template Library</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Download lightweight CSV templates, then recreate the workflow inside Atlas when you want automation.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(item => (
              <Card key={item.slug}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">{item.category}</Badge>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/templates/${item.slug}`}>Preview template</Link>
                  </Button>
                  <Button variant="ghost" onClick={() => downloadTemplate(item)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
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
        title={template.title}
        description={template.description}
        canonical={`/templates/${template.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "DigitalDocument",
          name: template.title,
          description: template.description,
          fileFormat: "text/csv",
        }}
      />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" className="mb-6 px-0">
          <Link to="/templates">All templates</Link>
        </Button>
        <Badge variant="secondary">{template.category}</Badge>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">{template.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{template.description}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Template Preview
              </CardTitle>
              <CardDescription>CSV columns and starter row.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b">
                    {template.columns.map(column => (
                      <th key={column} className="p-3 text-left font-medium">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {template.rows.map((row, index) => (
                    <tr key={index} className="border-b">
                      {row.map((cell, cellIndex) => (
                        <td key={`${index}-${cellIndex}`} className="p-3 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Use This Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => downloadTemplate(template)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={template.workflow}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Recreate in Atlas
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
