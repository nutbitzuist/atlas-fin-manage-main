-- =====================================================
-- FINANCIAL HEALTH HISTORY TABLE
-- Track financial health scores over time
-- =====================================================

CREATE TABLE IF NOT EXISTS public.financial_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Overall score
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Individual metrics
  debt_to_income_ratio NUMERIC(10, 4),
  savings_rate NUMERIC(10, 4),
  emergency_fund_months NUMERIC(10, 2),
  credit_utilization NUMERIC(10, 4),
  net_worth NUMERIC(15, 2),

  -- Scores for each component
  debt_score INTEGER CHECK (debt_score >= 0 AND debt_score <= 100),
  savings_score INTEGER CHECK (savings_score >= 0 AND savings_score <= 100),
  emergency_fund_score INTEGER CHECK (emergency_fund_score >= 0 AND emergency_fund_score <= 100),
  credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per date
  UNIQUE(user_id, date)
);

-- Add RLS policies
ALTER TABLE public.financial_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own financial health history"
  ON public.financial_health_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial health history"
  ON public.financial_health_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial health history"
  ON public.financial_health_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial health history"
  ON public.financial_health_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_health_history_user_date
  ON public.financial_health_history(user_id, date DESC);

-- Add comments
COMMENT ON TABLE public.financial_health_history IS 'Stores historical financial health scores and metrics for tracking progress over time';
COMMENT ON COLUMN public.financial_health_history.overall_score IS 'Overall financial health score (0-100)';
COMMENT ON COLUMN public.financial_health_history.debt_to_income_ratio IS 'Total debt payments divided by monthly income';
COMMENT ON COLUMN public.financial_health_history.savings_rate IS 'Percentage of income saved';
COMMENT ON COLUMN public.financial_health_history.emergency_fund_months IS 'Months of expenses covered by emergency fund';
COMMENT ON COLUMN public.financial_health_history.credit_utilization IS 'Credit card balance divided by credit limit';
