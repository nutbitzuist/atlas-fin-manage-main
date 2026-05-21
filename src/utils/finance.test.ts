import { describe, expect, it } from "vitest";
import { USD_THB_RATE, calculateInvestmentValue } from "./finance-calculations";

describe("finance utilities", () => {
  it("calculates mutual fund value from units and NAV before falling back", () => {
    expect(calculateInvestmentValue({
      id: "mutual-fund",
      investment_type: "mutual_fund",
      units: 100,
      current_nav: 12.5,
      current_value: 999,
      shares: null,
      current_price: null,
      equity: null,
    })).toBe(1_250);
  });

  it("falls back to current value when market fields are missing", () => {
    expect(calculateInvestmentValue({
      id: "stock-fallback",
      investment_type: "stock",
      units: null,
      current_nav: null,
      current_value: 7_500,
      shares: null,
      current_price: null,
      equity: null,
    })).toBe(7_500);
  });

  it("converts MT4/MT5 equity from USD to THB", () => {
    expect(calculateInvestmentValue({
      id: "mt4",
      investment_type: "mt4_mt5",
      units: null,
      current_nav: null,
      current_value: null,
      shares: null,
      current_price: null,
      equity: 1_000,
    })).toBe(1_000 * USD_THB_RATE);
  });

  it("uses face value as bond value fallback", () => {
    expect(calculateInvestmentValue({
      id: "bond",
      investment_type: "bond",
      units: null,
      current_nav: null,
      current_value: 99,
      face_value: 10_000,
      shares: null,
      current_price: null,
      equity: null,
      initial_investment: null,
    })).toBe(10_000);
  });

  it("falls back to initial investment for businesses without current value", () => {
    expect(calculateInvestmentValue({
      id: "business",
      investment_type: "business",
      units: null,
      current_nav: null,
      current_value: 0,
      shares: null,
      current_price: null,
      equity: null,
      face_value: null,
      initial_investment: 50_000,
    })).toBe(50_000);
  });
});
