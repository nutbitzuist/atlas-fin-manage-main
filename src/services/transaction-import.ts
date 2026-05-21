import type { TablesInsert } from "@/integrations/supabase/types";

export type CsvTransactionRow = Record<string, string>;

export function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function parseTransactionCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one transaction.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvTransactionRow>((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

export function normalizeTransactionDate(value: string) {
  if (!value) return new Date().toISOString().split("T")[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().split("T")[0];
}

export function mapCsvRowsToTransactions(userId: string, rows: CsvTransactionRow[]): TablesInsert<"transactions">[] {
  return rows.map((row) => {
    const rawAmount = Number.parseFloat((row.amount || "0").replace(/,/g, ""));
    if (!Number.isFinite(rawAmount) || rawAmount === 0) {
      throw new Error("Each row needs a non-zero amount.");
    }

    const rawType = (row.type || "").toLowerCase();
    const type = rawType === "income" || rawType === "expense"
      ? rawType
      : rawAmount < 0
        ? "expense"
        : "income";
    const amount = Math.abs(rawAmount);

    return {
      user_id: userId,
      type,
      category: row.category || "Other",
      amount,
      description: row.description || row.notes || null,
      transaction_date: normalizeTransactionDate(row.transaction_date || row.date),
      currency: row.currency || "THB",
      merchant: row.merchant || null,
      source: row.source || null,
      payment_method: row.payment_method || null,
    };
  });
}
