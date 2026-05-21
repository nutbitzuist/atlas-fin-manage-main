import { describe, expect, it } from "vitest";
import { mapCsvRowsToTransactions, parseCsvLine, parseTransactionCsv } from "./transaction-import";

describe("transaction CSV import", () => {
  it("parses quoted CSV values with escaped quotes", () => {
    expect(parseCsvLine('"2026-05-20","1,250.50","Coffee ""meeting"""')).toEqual([
      "2026-05-20",
      "1,250.50",
      'Coffee "meeting"',
    ]);
  });

  it("maps CSV text into row objects", () => {
    expect(parseTransactionCsv("date,amount,category\n2026-05-20,-150,Food")).toEqual([
      { date: "2026-05-20", amount: "-150", category: "Food" },
    ]);
  });

  it("normalizes signed amounts into transaction type and absolute amount", () => {
    const [transaction] = mapCsvRowsToTransactions("user-1", [
      { date: "2026-05-20", amount: "-450.25", category: "Transport", merchant: "BTS" },
    ]);

    expect(transaction.type).toBe("expense");
    expect(transaction.amount).toBe(450.25);
    expect(transaction.category).toBe("Transport");
    expect(transaction.merchant).toBe("BTS");
  });

  it("respects explicit income type even when amount is positive", () => {
    const [transaction] = mapCsvRowsToTransactions("user-1", [
      { transaction_date: "2026-05-20", amount: "50000", type: "income", source: "Salary" },
    ]);

    expect(transaction.type).toBe("income");
    expect(transaction.category).toBe("Other");
    expect(transaction.source).toBe("Salary");
  });

  it("rejects zero amount rows", () => {
    expect(() => mapCsvRowsToTransactions("user-1", [{ amount: "0" }])).toThrow("non-zero amount");
  });
});
