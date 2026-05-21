export type PlanningTransaction = {
  amount: number;
  category?: string | null;
  description?: string | null;
  merchant?: string | null;
  transaction_date: string;
  type: string;
};

export type PlanningIncomeSource = {
  amount: number;
  frequency: string;
  is_active?: boolean | null;
};

export type PlanningBill = {
  amount: number;
  due_date: string;
  is_paid?: boolean | null;
  is_recurring?: boolean | null;
  recurrence_period?: string | null;
  name: string;
};

export type DebtAccount = {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  type: "credit_card" | "loan";
};

export type DebtPlanItem = DebtAccount & {
  priority: number;
  monthlyInterest: number;
  payoffMonths: number | null;
  payoffDate: string | null;
  totalInterest: number | null;
};

export const formatTHB = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export const normalizeMonthlyAmount = (amount: number, frequency = "monthly") => {
  const normalized = frequency.toLowerCase();
  if (normalized === "yearly" || normalized === "annually" || normalized === "annual") return amount / 12;
  if (normalized === "quarterly") return amount / 3;
  if (normalized === "weekly") return amount * 4.33;
  if (normalized === "daily") return amount * 30;
  return amount;
};

export const getEstimatedMonthlyIncome = (sources: PlanningIncomeSource[]) =>
  sources.reduce((sum, source) => {
    if (source.is_active === false) return sum;
    return sum + normalizeMonthlyAmount(Number(source.amount || 0), source.frequency);
  }, 0);

export const getAverageMonthlyExpenses = (transactions: PlanningTransaction[], months = 3) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense" && new Date(transaction.transaction_date) >= startDate
  );

  return expenses.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0) / months;
};

export const buildCashFlowForecast = ({
  cashBalance,
  incomeSources,
  bills,
  transactions,
  days = 90,
}: {
  cashBalance: number;
  incomeSources: PlanningIncomeSource[];
  bills: PlanningBill[];
  transactions: PlanningTransaction[];
  days?: number;
}) => {
  const monthlyIncome = getEstimatedMonthlyIncome(incomeSources);
  const averageMonthlyExpenses = getAverageMonthlyExpenses(transactions, 3);
  const unpaidBills = bills.filter((bill) => !bill.is_paid);
  const billTotal = unpaidBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const projectedNetFlow = monthlyIncome - averageMonthlyExpenses;
  const projectedCash = cashBalance + projectedNetFlow * (days / 30) - billTotal;
  const runwayMonths = averageMonthlyExpenses > 0 ? cashBalance / averageMonthlyExpenses : null;
  const lowCashRisk = projectedCash < Math.max(averageMonthlyExpenses, 0);

  return {
    averageMonthlyExpenses,
    billTotal,
    lowCashRisk,
    monthlyIncome,
    projectedCash,
    projectedNetFlow,
    runwayMonths,
  };
};

export const buildDebtPayoffPlan = (
  debts: DebtAccount[],
  extraPayment = 0,
  strategy: "avalanche" | "snowball" = "avalanche"
) => {
  const activeDebts = debts
    .filter((debt) => debt.balance > 0)
    .sort((a, b) => {
      if (strategy === "snowball") return a.balance - b.balance || b.interestRate - a.interestRate;
      return b.interestRate - a.interestRate || b.balance - a.balance;
    });

  return activeDebts.map((debt, index): DebtPlanItem => {
    const monthlyInterestRate = Math.max(0, debt.interestRate) / 100 / 12;
    const payment = Math.max(0, debt.minimumPayment + (index === 0 ? extraPayment : 0));
    const monthlyInterest = debt.balance * monthlyInterestRate;
    let payoffMonths: number | null = null;

    if (payment > monthlyInterest && payment > 0) {
      payoffMonths = monthlyInterestRate > 0
        ? Math.ceil(-Math.log(1 - (monthlyInterestRate * debt.balance) / payment) / Math.log(1 + monthlyInterestRate))
        : Math.ceil(debt.balance / payment);
    }

    const payoffDate = payoffMonths
      ? new Date(new Date().getFullYear(), new Date().getMonth() + payoffMonths, 1).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : null;
    const totalInterest = payoffMonths ? Math.max(0, payment * payoffMonths - debt.balance) : null;

    return {
      ...debt,
      monthlyInterest,
      payoffDate,
      payoffMonths,
      priority: index + 1,
      totalInterest,
    };
  });
};

export const summarizeDebtPlan = (plan: DebtPlanItem[]) => ({
  totalBalance: plan.reduce((sum, debt) => sum + debt.balance, 0),
  totalMinimumPayment: plan.reduce((sum, debt) => sum + debt.minimumPayment, 0),
  estimatedInterest: plan.reduce((sum, debt) => sum + (debt.totalInterest || 0), 0),
  longestPayoffMonths: plan.reduce((max, debt) => Math.max(max, debt.payoffMonths || 0), 0),
});

const categoryKeywords: Array<{ category: string; keywords: string[] }> = [
  { category: "Food & Dining", keywords: ["restaurant", "cafe", "coffee", "grab", "food", "dining", "kfc", "mcdonald", "starbucks"] },
  { category: "Transportation", keywords: ["bts", "mrt", "taxi", "fuel", "gas", "parking", "toll", "bolt"] },
  { category: "Utilities", keywords: ["electric", "water", "internet", "phone", "mobile", "ais", "true", "dtac"] },
  { category: "Shopping", keywords: ["shopee", "lazada", "mall", "store", "market"] },
  { category: "Healthcare", keywords: ["hospital", "clinic", "pharmacy", "doctor"] },
  { category: "Entertainment", keywords: ["netflix", "spotify", "cinema", "movie", "game"] },
  { category: "Savings", keywords: ["saving", "emergency fund", "goal"] },
  { category: "Investment", keywords: ["broker", "fund", "stock", "investment", "mutual"] },
];

export const suggestTransactionCategory = (transaction: PlanningTransaction) => {
  const text = `${transaction.merchant || ""} ${transaction.description || ""} ${transaction.category || ""}`.toLowerCase();
  if (!text.trim()) return null;

  const match = categoryKeywords.find((group) => group.keywords.some((keyword) => text.includes(keyword)));
  return match?.category || null;
};

export const getCategorizationSuggestions = (transactions: PlanningTransaction[]) =>
  transactions
    .map((transaction) => ({
      transaction,
      suggestedCategory: suggestTransactionCategory(transaction),
    }))
    .filter(({ transaction, suggestedCategory }) => {
      if (!suggestedCategory) return false;
      const current = (transaction.category || "").toLowerCase();
      return ["other", "uncategorized", "uncategorised", "misc", "miscellaneous"].includes(current);
    });
