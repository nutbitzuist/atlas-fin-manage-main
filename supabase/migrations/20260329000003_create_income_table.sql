-- =====================================================
-- Migration: Create Income Table
-- =====================================================
-- Creates a dedicated table for recurring income sources.
-- This fixes the gap where FinancialHealth.tsx queries
-- from("income") but the table doesn't exist.
-- One-off income remains in the transactions table.

CREATE TABLE IF NOT EXISTS public.income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Income details
  source_name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' 
    CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'weekly', 'one-time')),
  currency TEXT DEFAULT 'THB',
  category TEXT, -- e.g., 'Salary', 'Rental', 'Investment', 'Freelance'
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Date range
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE, -- NULL = ongoing
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own income" ON public.income;
DROP POLICY IF EXISTS "Users can insert own income" ON public.income;
DROP POLICY IF EXISTS "Users can update own income" ON public.income;
DROP POLICY IF EXISTS "Users can delete own income" ON public.income;

CREATE POLICY "Users can view own income"
  ON public.income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income"
  ON public.income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income"
  ON public.income FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income"
  ON public.income FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_user_id ON public.income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_active ON public.income(user_id, is_active) WHERE is_active = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_income_updated_at ON public.income;
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON public.income
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.income IS 'Recurring income sources like salary, rental income, etc.';
COMMENT ON COLUMN public.income.frequency IS 'How often this income is received';
COMMENT ON COLUMN public.income.is_active IS 'Whether this income source is currently active';
COMMENT ON COLUMN public.income.end_date IS 'NULL means ongoing; set a date for temporary income';
