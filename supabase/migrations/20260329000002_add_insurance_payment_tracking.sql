-- =====================================================
-- Migration: Add Insurance Payment Tracking
-- =====================================================
-- Adds payment lifecycle tracking to insurance policies.
-- Enables users to track whether premiums have been paid,
-- when they're due next, and tax deduction eligibility.

-- Add status column (active/lapsed/cancelled)
ALTER TABLE public.insurance_policies 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'lapsed', 'cancelled'));

-- Add payment tracking columns
ALTER TABLE public.insurance_policies 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('paid', 'pending', 'overdue'));

ALTER TABLE public.insurance_policies 
  ADD COLUMN IF NOT EXISTS last_paid_date DATE;

ALTER TABLE public.insurance_policies 
  ADD COLUMN IF NOT EXISTS next_payment_date DATE;

-- Add tax deduction fields
ALTER TABLE public.insurance_policies 
  ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT false;

ALTER TABLE public.insurance_policies 
  ADD COLUMN IF NOT EXISTS tax_deduction_category TEXT 
  CHECK (tax_deduction_category IN ('life_insurance', 'health_insurance', 'retirement_insurance', NULL));

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_insurance_policies_payment_status 
  ON public.insurance_policies(user_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_next_payment 
  ON public.insurance_policies(next_payment_date) 
  WHERE status = 'active';

COMMENT ON COLUMN public.insurance_policies.status IS 'Policy status: active, lapsed, or cancelled';
COMMENT ON COLUMN public.insurance_policies.payment_status IS 'Current payment status: paid (current period), pending, or overdue';
COMMENT ON COLUMN public.insurance_policies.last_paid_date IS 'Date when the premium was last paid';
COMMENT ON COLUMN public.insurance_policies.next_payment_date IS 'Date when the next premium payment is due';
COMMENT ON COLUMN public.insurance_policies.tax_deductible IS 'Whether this policy premium is tax deductible';
COMMENT ON COLUMN public.insurance_policies.tax_deduction_category IS 'Tax deduction category for Thai tax calculation';
