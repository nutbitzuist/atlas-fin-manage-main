import type { Tables } from "@/integrations/supabase/types";

type Investment = Tables<"investments">;

export const USD_THB_RATE = 34.5;

export function calculateInvestmentValue(inv: Pick<Investment,
  "id" |
  "investment_type" |
  "units" |
  "current_nav" |
  "current_value" |
  "shares" |
  "current_price" |
  "equity" |
  "face_value" |
  "initial_investment"
>) {
  switch (inv.investment_type) {
    case "mutual_fund": {
      const value = Number(inv.units || 0) * Number(inv.current_nav || 0);
      return value > 0 ? value : Number(inv.current_value || 0);
    }
    case "stock": {
      const value = Number(inv.shares || 0) * Number(inv.current_price || 0);
      return value > 0 ? value : Number(inv.current_value || 0);
    }
    case "mt4_mt5":
      return Number(inv.equity || 0) * USD_THB_RATE;
    case "bond":
      return Number(inv.face_value || inv.current_value || 0);
    case "business":
      return Number(inv.current_value || inv.initial_investment || 0);
    default:
      return Number(inv.current_value || 0);
  }
}
