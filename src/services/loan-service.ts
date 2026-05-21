import type { LoanInsert, LoanRow, LoanUpdate } from "@/data/loan-queries";
import {
  createLoanRaw,
  deleteLoanByIdRaw,
  getLoansByUserRaw,
  updateLoanRaw,
} from "@/data/loan-queries";

export type { LoanInsert, LoanRow, LoanUpdate } from "@/data/loan-queries";

export async function getLoansByUser(userId: string): Promise<LoanRow[]> {
  return getLoansByUserRaw(userId);
}

export async function createLoan(loan: LoanInsert): Promise<LoanRow> {
  return createLoanRaw(loan);
}

export async function updateLoan(loanId: string, userId: string, updates: LoanUpdate) {
  await updateLoanRaw(loanId, userId, updates);
}

export async function deleteLoanById(userId: string, loanId: string) {
  await deleteLoanByIdRaw(userId, loanId);
}
