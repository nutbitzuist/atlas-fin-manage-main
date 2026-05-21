import { describe, expect, it } from "vitest";
import {
  buildCashFlowForecast,
  buildDebtPayoffPlan,
  getCategorizationSuggestions,
  getEstimatedMonthlyIncome,
  normalizeMonthlyAmount,
  summarizeDebtPlan,
} from "./planning";

describe("planning utilities", () => {
  it("normalizes recurring income into monthly amounts", () => {
    expect(normalizeMonthlyAmount(120_000, "yearly")).toBe(10_000);
    expect(normalizeMonthlyAmount(30_000, "quarterly")).toBe(10_000);
    expect(normalizeMonthlyAmount(1_000, "weekly")).toBeCloseTo(4_330);
    expect(normalizeMonthlyAmount(500, "daily")).toBe(15_000);
  });

  it("ignores inactive income sources", () => {
    expect(getEstimatedMonthlyIncome([
      { amount: 50_000, frequency: "monthly", is_active: true },
      { amount: 12_000, frequency: "yearly", is_active: false },
    ])).toBe(50_000);
  });

  it("builds a cash-flow forecast from cash, income, bills, and recent expenses", () => {
    const now = new Date();
    const forecast = buildCashFlowForecast({
      cashBalance: 100_000,
      days: 90,
      incomeSources: [{ amount: 60_000, frequency: "monthly", is_active: true }],
      bills: [
        { amount: 5_000, due_date: now.toISOString(), is_paid: false, name: "Rent" },
        { amount: 1_000, due_date: now.toISOString(), is_paid: true, name: "Internet" },
      ],
      transactions: [
        { amount: 9_000, type: "expense", transaction_date: now.toISOString(), category: "Food" },
        { amount: 3_000, type: "income", transaction_date: now.toISOString(), category: "Bonus" },
      ],
    });

    expect(forecast.monthlyIncome).toBe(60_000);
    expect(forecast.averageMonthlyExpenses).toBe(3_000);
    expect(forecast.billTotal).toBe(5_000);
    expect(forecast.projectedCash).toBe(266_000);
    expect(forecast.lowCashRisk).toBe(false);
  });

  it("prioritizes avalanche and snowball debt plans differently", () => {
    const debts = [
      { id: "card", name: "Card", balance: 50_000, interestRate: 20, minimumPayment: 2_000, type: "credit_card" as const },
      { id: "loan", name: "Loan", balance: 10_000, interestRate: 5, minimumPayment: 1_000, type: "loan" as const },
    ];

    expect(buildDebtPayoffPlan(debts, 500, "avalanche")[0].id).toBe("card");
    expect(buildDebtPayoffPlan(debts, 500, "snowball")[0].id).toBe("loan");
  });

  it("summarizes debt plans", () => {
    const plan = buildDebtPayoffPlan([
      { id: "card", name: "Card", balance: 12_000, interestRate: 18, minimumPayment: 1_000, type: "credit_card" },
    ]);

    expect(summarizeDebtPlan(plan).totalBalance).toBe(12_000);
    expect(summarizeDebtPlan(plan).totalMinimumPayment).toBe(1_000);
    expect(summarizeDebtPlan(plan).longestPayoffMonths).toBeGreaterThan(0);
  });

  it("suggests categories only for uncategorized transactions", () => {
    const suggestions = getCategorizationSuggestions([
      {
        amount: 120,
        category: "Other",
        merchant: "Starbucks",
        transaction_date: new Date().toISOString(),
        type: "expense",
      },
      {
        amount: 80,
        category: "Food & Dining",
        merchant: "Starbucks",
        transaction_date: new Date().toISOString(),
        type: "expense",
      },
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestedCategory).toBe("Food & Dining");
  });
});
