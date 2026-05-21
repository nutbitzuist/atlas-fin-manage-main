-- =====================================================
-- EMERGENCY FUND FEATURE
-- Add emergency fund tracking to user profiles
-- =====================================================

-- Add emergency fund fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS emergency_fund_target_months INTEGER DEFAULT 6 CHECK (emergency_fund_target_months >= 1 AND emergency_fund_target_months <= 24),
ADD COLUMN IF NOT EXISTS emergency_fund_current_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS emergency_fund_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_emergency_fund ON public.profiles(id, emergency_fund_current_amount);

-- Create trigger to update emergency_fund_updated_at
CREATE OR REPLACE FUNCTION update_emergency_fund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.emergency_fund_current_amount IS DISTINCT FROM OLD.emergency_fund_current_amount) OR
     (NEW.emergency_fund_target_months IS DISTINCT FROM OLD.emergency_fund_target_months) THEN
    NEW.emergency_fund_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_emergency_fund_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_fund_updated_at();

-- Set default values for existing users
UPDATE public.profiles
SET
  emergency_fund_target_months = 6,
  emergency_fund_current_amount = 0,
  emergency_fund_updated_at = NOW()
WHERE emergency_fund_target_months IS NULL;

-- Comments
COMMENT ON COLUMN public.profiles.emergency_fund_target_months IS 'Target number of months of expenses to save for emergencies (typically 3-6 months)';
COMMENT ON COLUMN public.profiles.emergency_fund_current_amount IS 'Current amount saved in emergency fund';
COMMENT ON COLUMN public.profiles.emergency_fund_updated_at IS 'Timestamp of last emergency fund update';
