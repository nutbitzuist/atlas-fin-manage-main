import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type BillRow = Tables<"bills">;
export type BillInsert = TablesInsert<"bills">;
export type BillUpdate = TablesUpdate<"bills">;

export type BillQueryOptions = {
  isRecurring?: boolean;
  isPaid?: boolean;
  autoPay?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  dueDateBefore?: string;
  dueDateAfter?: string;
  orderBy?: "due_date" | "updated_at" | "created_at";
  ascending?: boolean;
};

type BillTemplateNameLookupRow = Pick<Tables<"bills">, "id">;
type CashAccountLabelRow = Pick<Tables<"cash_accounts">, "bank_name" | "account_type">;

export type TransactionForBillDuplicateRow = Pick<Tables<"transactions">, "id">;

export async function getBillsByUserIdRaw(
  userId: string,
  options: BillQueryOptions = {},
) {
  let query = supabase
    .from("bills")
    .select("*")
    .eq("user_id", userId);

  if (typeof options.isRecurring === "boolean") {
    query = query.eq("is_recurring", options.isRecurring);
  }

  if (typeof options.isPaid === "boolean") {
    query = query.eq("is_paid", options.isPaid);
  }

  if (options.orderBy) {
    const ascending = options.ascending ?? false;
    query = query.order(options.orderBy, { ascending });
  }

  if (typeof options.autoPay === "boolean") {
    query = query.eq("auto_pay", options.autoPay);
  }

  if (options.dueDateFrom) {
    query = query.gte("due_date", options.dueDateFrom);
  }

  if (options.dueDateTo) {
    query = query.lte("due_date", options.dueDateTo);
  }

  if (options.dueDateBefore) {
    query = query.lt("due_date", options.dueDateBefore);
  }

  if (options.dueDateAfter) {
    query = query.gt("due_date", options.dueDateAfter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as BillRow[] | null;
}

export async function getBillByTemplateForUserRaw(
  userId: string,
  name: string,
  type: "income" | "expense",
) {
  const normalizedName = name.trim();
  const { data, error } = await supabase
    .from("bills")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", normalizedName)
    .eq("type", type)
    .eq("is_recurring", true)
    .eq("is_paid", false)
    .maybeSingle();

  if (error) throw error;
  return data as BillTemplateNameLookupRow | null;
}

export async function getBillByIdRaw(id: string) {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as BillRow;
}

export async function createBillRaw(bill: BillInsert): Promise<BillRow> {
  const { data, error } = await supabase
    .from("bills")
    .insert(bill)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create bill");
  return data as BillRow;
}

export async function updateBillRaw(id: string, userId: string, updates: BillUpdate) {
  const { error } = await supabase
    .from("bills")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateBillByIdRaw(id: string, updates: BillUpdate) {
  const { error } = await supabase
    .from("bills")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteBillRaw(id: string, userId: string) {
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function markBillPaidRaw(billId: string, userId: string) {
  const { error } = await supabase
    .from("bills")
    .update({
      is_paid: true,
      is_recurring: false,
    })
    .eq("id", billId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getCashAccountLabelByIdRaw(accountId: string) {
  const { data, error } = await supabase
    .from("cash_accounts")
    .select("bank_name, account_type")
    .eq("id", accountId)
    .single();

  if (error) throw error;
  return data as CashAccountLabelRow | null;
}

export async function getExistingPaymentTransactionRaw(
  userId: string,
  type: string,
  amount: number,
  dueDate: string,
  merchantName: string | null,
  sourceName: string | null,
) {
  const normalizedDueDate = dueDate.includes("T") ? dueDate.slice(0, 10) : dueDate;

  const transactionQuery = supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type || "expense")
    .eq("amount", amount)
    .eq("transaction_date", normalizedDueDate);

  if (merchantName) {
    const { data } = await transactionQuery
      .eq("merchant", merchantName.trim())
      .maybeSingle();
    return data as TransactionForBillDuplicateRow | null;
  }

  if (!sourceName) {
    return null;
  }

  const { data } = await transactionQuery
    .eq("source", sourceName.trim() || null)
    .maybeSingle();
  return data as TransactionForBillDuplicateRow | null;
}

export async function getRecurringBillTemplateRaw(
  userId: string,
  name: string,
  type: "income" | "expense",
) {
  const normalizedName = name.trim();
  const { data, error } = await supabase
    .from("bills")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", normalizedName)
    .eq("type", type)
    .eq("is_recurring", true)
    .eq("is_paid", false)
    .maybeSingle();

  if (error) throw error;
  return data as BillTemplateNameLookupRow | null;
}

export async function cloneNextRecurringBillRaw(templateBill: BillRow) {
  const { data: nextBill, error } = await supabase
    .from("bills")
    .insert(templateBill)
    .select()
    .single();

  if (error) throw error;
  return nextBill as BillRow;
}
