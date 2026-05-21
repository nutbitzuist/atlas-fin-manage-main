-- =====================================================
-- TAX PLANNING TABLE
-- Store user tax planning data and deductions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tax_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  annual_income NUMERIC(15, 2) DEFAULT 0,

  -- Deductions (stored as JSONB for flexibility)
  deductions JSONB DEFAULT '{}'::jsonb,
  donation_amount NUMERIC(15, 2) DEFAULT 0,

  -- Auto-calculated fields
  total_deductions NUMERIC(15, 2) DEFAULT 0,
  taxable_income NUMERIC(15, 2) DEFAULT 0,
  estimated_tax NUMERIC(15, 2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per tax year
  UNIQUE(user_id, tax_year)
);

-- Add RLS policies
ALTER TABLE public.tax_planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tax planning data"
  ON public.tax_planning
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax planning data"
  ON public.tax_planning
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax planning data"
  ON public.tax_planning
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax planning data"
  ON public.tax_planning
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_planning_user_year
  ON public.tax_planning(user_id, tax_year);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_planning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_planning_updated_at
  BEFORE UPDATE ON public.tax_planning
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_planning_updated_at();

-- Add comments
COMMENT ON TABLE public.tax_planning IS 'Stores user tax planning data including income, deductions, and tax estimates for Thai tax calculation';
COMMENT ON COLUMN public.tax_planning.deductions IS 'JSONB object containing deduction categories and amounts (rmf_ltf, life_insurance, health_insurance, provident_fund, home_loan, etc.)';
COMMENT ON COLUMN public.tax_planning.tax_year IS 'Tax year for this planning data (e.g., 2025)';
