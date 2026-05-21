import { calculateInvestmentValue } from "@/utils/finance-calculations";
import {
  fetchCashAccountsForSummary,
  fetchCreditCardsForSummary,
  fetchInvestmentsForSummary,
  fetchLoansForSummary,
  fetchOtherAssetsForSummary,
  fetchRealEstateForSummary,
  fetchVehiclesForSummary,
  type CashAccountRow,
  type CreditCardRow,
  type InvestmentRow,
  type LoanRow,
  type OtherAssetRow,
  type RealEstateRow,
  type SummaryStatus,
  type VehicleRow,
} from "@/data/financial-overview-queries";

export type AssetBreakdown = {
  category: string;
  amount: number;
  percentage: number;
};

export type AssetSummary = {
  cashAccounts: CashAccountRow[];
  investments: InvestmentRow[];
  realEstateAssets: RealEstateRow[];
  vehicles: VehicleRow[];
  otherAssets: OtherAssetRow[];
  totalCash: number;
  totalInvestments: number;
  totalRealEstate: number;
  totalVehicles: number;
  totalOtherAssets: number;
  totalAssets: number;
  categoryBreakdown: AssetBreakdown[];
};

export type LiabilitySummary = {
  creditCards: CreditCardRow[];
  loans: LoanRow[];
  totalCreditCards: number;
  totalLoans: number;
  totalLiabilities: number;
  categoryBreakdown: AssetBreakdown[];
};

const sum = (rows: Array<{ [key: string]: unknown }>, field: string) =>
  rows.reduce((total, row) => total + Number((row as Record<string, unknown>)[field] || 0), 0);

const toPercent = (value: number, total: number) => {
  return total > 0 ? (value / total) * 100 : 0;
};

export async function getAssetSummary(userId: string, status: SummaryStatus = "active"): Promise<AssetSummary> {
  const [cashAccounts, investments, realEstateAssets, vehicles, otherAssets] = await Promise.all([
    fetchCashAccountsForSummary(userId, status),
    fetchInvestmentsForSummary(userId, status),
    fetchRealEstateForSummary(userId, status),
    fetchVehiclesForSummary(userId, status),
    fetchOtherAssetsForSummary(userId, status),
  ]);

  const totalCash = sum(cashAccounts, "balance");
  const totalInvestments = investments.reduce((acc, inv) => acc + calculateInvestmentValue(inv), 0);
  const totalRealEstate = sum(realEstateAssets, "current_value");
  const totalVehicles = sum(vehicles, "current_value");
  const totalOtherAssets = sum(otherAssets, "current_value");

  const totalAssets = totalCash + totalInvestments + totalRealEstate + totalVehicles + totalOtherAssets;

  const categoryBreakdown = [
    { category: "Cash & Bank Accounts", amount: totalCash, percentage: toPercent(totalCash, totalAssets) },
    { category: "Investments", amount: totalInvestments, percentage: toPercent(totalInvestments, totalAssets) },
    { category: "Real Estate", amount: totalRealEstate, percentage: toPercent(totalRealEstate, totalAssets) },
    { category: "Vehicles", amount: totalVehicles, percentage: toPercent(totalVehicles, totalAssets) },
    { category: "Other Assets", amount: totalOtherAssets, percentage: toPercent(totalOtherAssets, totalAssets) },
  ];

  return {
    cashAccounts,
    investments,
    realEstateAssets,
    vehicles,
    otherAssets,
    totalCash,
    totalInvestments,
    totalRealEstate,
    totalVehicles,
    totalOtherAssets,
    totalAssets,
    categoryBreakdown,
  };
}

export async function getLiabilitySummary(
  userId: string,
  status: SummaryStatus = "active",
): Promise<LiabilitySummary> {
  const [creditCards, loans] = await Promise.all([
    fetchCreditCardsForSummary(userId, status),
    fetchLoansForSummary(userId, status),
  ]);

  const totalCreditCards = sum(creditCards, "current_balance");
  const totalLoans = sum(loans, "current_balance");
  const totalLiabilities = totalCreditCards + totalLoans;

  const categoryBreakdown: AssetBreakdown[] = [
    ...creditCards
      .map((card) => ({
        category: card.card_name || card.bank_name || "Credit Card",
        amount: Number(card.current_balance || 0),
        percentage: toPercent(Number(card.current_balance || 0), totalLiabilities),
      })),
    ...loans
      .map((loan) => ({
        category: loan.loan_name || loan.lender_name || `${loan.loan_type || "Loan"}`,
        amount: Number(loan.current_balance || 0),
        percentage: toPercent(Number(loan.current_balance || 0), totalLiabilities),
      })),
  ];

  return {
    creditCards,
    loans,
    totalCreditCards,
    totalLoans,
    totalLiabilities,
    categoryBreakdown: categoryBreakdown.filter((item) => item.amount > 0),
  };
}
