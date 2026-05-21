import { logAuditEvent } from "@/services/audit-service";
import { createTransaction, type TransactionRow } from "@/services/transaction-service";
import { toLocalDateInput } from "@/utils/date";

import type {
  BillInsert,
  BillQueryOptions,
  BillRow,
  BillUpdate,
} from "@/data/bill-queries";
import {
  cloneNextRecurringBillRaw,
  createBillRaw,
  deleteBillRaw,
  getBillsByUserIdRaw,
  getBillByIdRaw,
  getBillByTemplateForUserRaw,
  getCashAccountLabelByIdRaw,
  getExistingPaymentTransactionRaw,
  deactivateRecurringBillsByNameRaw,
  getRecurringBillTemplateRaw,
  markBillPaidRaw,
  updateBillByIdRaw,
  updateBillRaw,
} from "@/data/bill-queries";

const normalizeDateInput = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  if (date instanceof Date) return toLocalDateInput(date);
  return date.includes("T") ? date.slice(0, 10) : date;
};

const normalizeTemplateName = (name?: string | null) => (name || "Unknown Bill").trim();

export type ProcessBillResult = {
  success: boolean;
  error?: unknown;
  transactionId?: string;
  nextBillId?: string;
};

export type { BillInsert, BillQueryOptions, BillRow, BillUpdate } from "@/data/bill-queries";

export async function getBillsByUserId(
  userId: string,
  options: BillQueryOptions = {},
) {
  return getBillsByUserIdRaw(userId, options);
}

export async function getBillByTemplateForUser(
  userId: string,
  name: string,
  type: "income" | "expense",
) {
  return getBillByTemplateForUserRaw(userId, name, type);
}

export async function getBillById(id: string) {
  return getBillByIdRaw(id);
}

export async function createBill(bill: BillInsert): Promise<BillRow> {
  return createBillRaw(bill);
}

export async function updateBill(id: string, userId: string, updates: BillUpdate) {
  await updateBillRaw(id, userId, updates);
}

export async function deleteBill(id: string, userId: string) {
  await deleteBillRaw(id, userId);

  void logAuditEvent({
    user_id: userId,
    event_type: "bill_deleted",
    entity_type: "bills",
    entity_id: id,
  });
}

export async function deactivateRecurringTemplateByName(
  userId: string,
  type: "expense" | "income",
  name: string,
) {
  const normalizedName = normalizeTemplateName(name);
  await deactivateRecurringBillsByNameRaw(userId, normalizedName, type);
}

export type TransactionLikeForBillTemplate = {
  merchant?: string | null;
  source?: string | null;
  amount: number;
  currency?: string | null;
  transaction_date: string;
  category: string | null;
  description: string | null;
  account_id: string | null;
};

const getNextDueDate = (dueDate: string, recurrencePeriod: string) => {
  const currentDueDate = new Date(dueDate);
  const nextDueDate = new Date(currentDueDate);
  const normalizedPeriod = recurrencePeriod.trim().toLowerCase();

  switch (normalizedPeriod) {
    case "weekly":
      nextDueDate.setDate(currentDueDate.getDate() + 7);
      break;
    case "monthly":
      nextDueDate.setMonth(currentDueDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDueDate.setMonth(currentDueDate.getMonth() + 3);
      break;
    case "yearly":
      nextDueDate.setFullYear(currentDueDate.getFullYear() + 1);
      break;
    default:
      nextDueDate.setMonth(currentDueDate.getMonth() + 1);
  }

  return nextDueDate;
};

const buildRecurringTemplatePayload = (bill: BillRow): BillInsert => {
  const { id, created_at, updated_at, user_id, ...rest } = bill;
  return {
    ...rest,
    user_id,
    due_date: normalizeDateInput(rest.due_date),
  } as BillInsert;
};

/**
 * Processes a bill payment:
 * 1. Creates an expense transaction in the 'transactions' table.
 * 2. Marks the current bill as paid.
 * 3. Creates the next instance if the bill is recurring.
 */
export const payBill = async (
  billId: string,
  userId: string,
  accountId?: string | null,
): Promise<ProcessBillResult> => {
  try {
    const bill = await getBillByIdRaw(billId);
    if (!bill || bill.user_id !== userId) throw new Error("Bill not found");

    const effectiveAccountId = accountId || bill.account_id;
    let accountName = "Manual Payment";

    if (effectiveAccountId) {
      try {
        const account = await getCashAccountLabelByIdRaw(effectiveAccountId);
        if (account) {
          accountName = `${account.bank_name} - ${account.account_type}`;
        }
      } catch {
        accountName = "Manual Payment";
      }
    }

    const merchantName = bill.type === "income" ? null : bill.name;
    const sourceName = bill.type === "income" ? bill.name : null;

    const existingTrans = await getExistingPaymentTransactionRaw(
      userId,
      bill.type || "expense",
      bill.amount,
      normalizeDateInput(bill.due_date),
      merchantName,
      sourceName,
    );

    let transactionId;

    if (existingTrans) {
      transactionId = existingTrans.id;
    } else {
      const transaction = await createTransaction({
        user_id: userId,
        type: bill.type || "expense",
        amount: bill.amount,
        category: bill.category || (bill.type === "income" ? "Salary" : "Bills"),
        transaction_date: normalizeDateInput(bill.due_date),
        merchant: merchantName,
        source: sourceName,
        description: `Recurring ${bill.type || "expense"}: ${bill.name}. ${bill.description || ""}`,
        account_id: effectiveAccountId,
        account_name: accountName,
        payment_method: effectiveAccountId ? "Bank Transfer" : "Cash",
        is_recurring: bill.is_recurring,
      }) as TransactionRow;

      transactionId = transaction.id;
    }

    await markBillPaidRaw(billId, userId);

    let nextBillId;
    if (bill.is_recurring && bill.recurrence_period) {
      const nextDueDate = getNextDueDate(bill.due_date, bill.recurrence_period);
      const nextBillPayload = buildRecurringTemplatePayload({
        ...bill,
        due_date: normalizeDateInput(nextDueDate),
        auto_pay: bill.auto_pay,
        account_id: bill.account_id,
        type: bill.type || "expense",
        is_paid: false,
        is_recurring: bill.is_recurring,
      });

      const nextBill = await cloneNextRecurringBillRaw({
        ...nextBillPayload,
        amount: bill.amount,
      });

      nextBillId = nextBill.id;
    }

    void logAuditEvent({
      user_id: userId,
      event_type: "bill_paid",
      entity_type: "bills",
      entity_id: billId,
      metadata: {
        transaction_id: transactionId,
        next_bill_id: nextBillId,
        bill_name: bill.name,
        amount: bill.amount,
        currency: bill.currency || "THB",
      },
    });

    return {
      success: true,
      transactionId,
      nextBillId,
    };
  } catch (error) {
    console.error("Error paying bill:", error);
    return { success: false, error };
  }
};

/**
 * Creates or updates a bill automation template from a transaction.
 */
export const upsertBillFromTransaction = async (
  transactionData: TransactionLikeForBillTemplate,
  recurrencePeriod: string = "monthly",
  type: "expense" | "income" = "expense",
  userId: string,
  previousName?: string | null,
) => {
  try {
    const billName = normalizeTemplateName(transactionData.merchant || transactionData.source);
    const transactionDate = normalizeDateInput(transactionData.transaction_date);
    if (!transactionDate) throw new Error("Transaction date is required");

    const previousBillName = previousName ? normalizeTemplateName(previousName) : "";
    if (previousBillName && previousBillName !== billName) {
      await deactivateRecurringBillsByNameRaw(userId, previousBillName, type);
    }

    const existingBill = await getRecurringBillTemplateRaw(userId, billName, type);

    const billData = {
      user_id: userId,
      name: billName,
      amount: transactionData.amount,
      currency: transactionData.currency || "THB",
      due_date: transactionDate,
      category: transactionData.category,
      is_recurring: true,
      recurrence_period: recurrencePeriod,
      is_paid: false,
      description: transactionData.description,
      auto_pay: true,
      account_id: transactionData.account_id,
      type,
    };

    if (existingBill) {
      await updateBillByIdRaw(existingBill.id, billData as BillUpdate);
      return { success: true, billId: existingBill.id };
    }

    const created = await createBillRaw(billData as BillInsert);
    return { success: true, billId: created.id };
  } catch (error) {
    console.error("Error upserting bill:", error);
    return { success: false, error };
  }
};
