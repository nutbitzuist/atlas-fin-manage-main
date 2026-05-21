-- Add this_year_contribution column to investments table for tracking
-- current year's contributions to tax-deductible mutual funds (RMF, SSF, Thai ESG)

ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS this_year_contribution numeric(15,2);

COMMENT ON COLUMN public.investments.this_year_contribution IS 'Current year contribution amount for tax deduction tracking (RMF/SSF/Thai ESG)';
