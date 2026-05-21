import { writeFileSync } from "node:fs";
import { join } from "node:path";

const siteUrl = "https://findash.app";
const today = new Date().toISOString().slice(0, 10);

const routes = [
  "/",
  "/calculators",
  "/calculators/thai-income-tax-calculator",
  "/calculators/rmf-deduction-calculator",
  "/calculators/ssf-deduction-calculator",
  "/calculators/thai-esg-deduction-calculator",
  "/calculators/emergency-fund-calculator",
  "/calculators/savings-goal-calculator",
  "/calculators/debt-avalanche-calculator",
  "/calculators/debt-snowball-calculator",
  "/calculators/credit-card-payoff-calculator",
  "/calculators/mortgage-affordability-calculator",
  "/calculators/car-loan-calculator",
  "/calculators/compound-interest-calculator",
  "/calculators/retirement-savings-calculator",
  "/calculators/net-worth-calculator",
  "/calculators/budget-planner-calculator",
  "/calculators/inflation-impact-calculator",
  "/calculators/financial-health-score-calculator",
  "/guides",
  "/guides/rmf-vs-ssf-vs-thai-esg",
  "/guides/debt-snowball-vs-avalanche",
  "/guides/rent-vs-buy-bangkok",
  "/guides/emergency-fund-by-income-level",
  "/guides/how-much-to-save-monthly-for-1m",
  "/use-cases",
  "/use-cases/bangkok-cost-of-living-budget-planner",
  "/use-cases/chiang-mai-monthly-budget-template",
  "/use-cases/emergency-fund-calculator-for-bangkok-expenses",
  "/templates",
  "/templates/budget-spreadsheet",
  "/templates/thai-tax-checklist",
  "/templates/monthly-money-review-template",
  "/templates/debt-payoff-spreadsheet",
  "/templates/net-worth-tracker",
  "/templates/emergency-fund-tracker",
  "/templates/insurance-tracker",
  "/templates/investment-tracker",
  "/learn",
  "/learn/savings-rate",
  "/learn/debt-to-income-ratio",
  "/learn/credit-utilization",
  "/learn/emergency-fund",
  "/learn/rmf",
  "/learn/ssf",
  "/learn/thai-esg",
  "/learn/net-worth",
  "/learn/cash-flow",
  "/learn/sinking-funds",
  "/learn/compound-interest",
  "/privacy",
  "/terms",
];

const urlset = routes.map((route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${route === "/" ? "1.0" : route.split("/").length <= 2 ? "0.8" : "0.7"}</priority>
  </url>`).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>
`;

writeFileSync(join(process.cwd(), "public", "sitemap.xml"), sitemap);
console.log(`Generated sitemap with ${routes.length} public routes.`);
