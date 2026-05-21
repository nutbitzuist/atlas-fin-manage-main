import type {
  CashAccountBalanceRow,
  CashAccountFullRow,
  CashAccountInsert,
  CashAccountRow,
  CashAccountStatus,
  CashAccountUpdate,
} from "@/data/cash-account-queries";
import {
  createCashAccount as createCashAccountQuery,
  deleteCashAccountById as deleteCashAccountByIdQuery,
  getCashAccountBalancesByUser as getCashAccountBalancesByUserQuery,
  getCashAccountsByUser as getCashAccountsByUserQuery,
  updateCashAccount as updateCashAccountQuery,
  getCashAccountsByUserFull as getCashAccountsByUserFullQuery,
} from "@/data/cash-account-queries";

export type {
  CashAccountBalanceRow,
  CashAccountFullRow,
  CashAccountInsert,
  CashAccountRow,
  CashAccountStatus,
  CashAccountUpdate,
} from "@/data/cash-account-queries";

export async function getCashAccountsByUser(
  userId: string,
  status: CashAccountStatus = "active",
): Promise<CashAccountRow[]> {
  return getCashAccountsByUserQuery(userId, status);
}

export async function getCashAccountBalancesByUser(
  userId: string,
  status: CashAccountStatus = "active",
): Promise<CashAccountBalanceRow[]> {
  return getCashAccountBalancesByUserQuery(userId, status);
}

export async function getCashAccountsByUserFull(
  userId: string,
  status: CashAccountStatus = "active",
): Promise<CashAccountFullRow[]> {
  return getCashAccountsByUserFullQuery(userId, status);
}

export async function createCashAccount(account: CashAccountInsert): Promise<CashAccountFullRow> {
  return createCashAccountQuery(account);
}

export async function updateCashAccount(
  accountId: string,
  userId: string,
  updates: CashAccountUpdate,
) {
  await updateCashAccountQuery(accountId, userId, updates);
}

export async function deleteCashAccountById(userId: string, accountId: string) {
  await deleteCashAccountByIdQuery(userId, accountId);
}
