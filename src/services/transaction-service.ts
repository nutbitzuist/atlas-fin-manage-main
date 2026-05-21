import { logAuditEvent } from "@/services/audit-service";
import type { Json } from "@/integrations/supabase/types";
import type {
  TransactionInsert,
  TransactionQueryOptions,
  TransactionRow,
  TransactionUpdate,
} from "@/data/transaction-queries";
import {
  createTransactionRaw,
  deleteTransactionRaw,
  getTransactionsRawByUserId,
  insertTransactionsRaw,
  reassignTransactionCategoryRaw,
  updateTransactionCategoryRaw,
  updateTransactionRaw,
} from "@/data/transaction-queries";

export type { TransactionInsert, TransactionQueryOptions, TransactionRow, TransactionUpdate } from "@/data/transaction-queries";

export async function insertTransactions(
  userId: string,
  transactions: TransactionInsert[],
  auditMetadata?: Json,
) {
  await insertTransactionsRaw(transactions);

  void logAuditEvent({
    user_id: userId,
    event_type: "transactions_created",
    entity_type: "transactions",
    metadata: {
      count: transactions.length,
      source: "bulk_insert",
      ...(auditMetadata && typeof auditMetadata === "object" && !Array.isArray(auditMetadata) ? auditMetadata : {}),
    },
  });
}

export async function getTransactionsByUserId(
  userId: string,
  options: TransactionQueryOptions = {},
  select = "*",
) {
  return getTransactionsRawByUserId(userId, options, select);
}

export async function createTransaction(data: TransactionInsert): Promise<TransactionRow> {
  return createTransactionRaw(data);
}

export async function reassignTransactionCategory(
  userId: string,
  sourceCategory: string,
  targetCategory: string,
) {
  await reassignTransactionCategoryRaw(userId, sourceCategory, targetCategory);
}

export async function updateTransaction(
  transactionId: string,
  userId: string,
  updates: TransactionUpdate,
) {
  await updateTransactionRaw(transactionId, userId, updates);
}

export async function updateTransactionCategory(transactionId: string, userId: string, category: string) {
  await updateTransactionCategoryRaw(transactionId, userId, category);

  void logAuditEvent({
    user_id: userId,
    event_type: "transaction_updated",
    entity_type: "transactions",
    entity_id: transactionId,
    metadata: { field: "category", value: category },
  });
}

export async function deleteTransaction(transactionId: string, userId: string) {
  await deleteTransactionRaw(transactionId, userId);

  void logAuditEvent({
    user_id: userId,
    event_type: "transaction_deleted",
    entity_type: "transactions",
    entity_id: transactionId,
  });
}
