-- =====================================================
-- Migration: Add Monthly Updates System
-- =====================================================
-- Creates a table to track monthly financial review completions.
-- Each row represents one month's review checklist for a user.

CREATE TABLE IF NOT EXISTS public.monthly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of the month (e.g., '2026-03-01')
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  
  -- Checklist items
  cash_updated BOOLEAN DEFAULT false,
  investments_updated BOOLEAN DEFAULT false,
  expenses_reviewed BOOLEAN DEFAULT false,
  bills_paid_confirmed BOOLEAN DEFAULT false,
  insurance_reviewed BOOLEAN DEFAULT false,
  budget_set BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One record per user per month
  UNIQUE(user_id, month)
);

ALTER TABLE public.monthly_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own monthly updates" ON public.monthly_updates;
DROP POLICY IF EXISTS "Users can insert own monthly updates" ON public.monthly_updates;
DROP POLICY IF EXISTS "Users can update own monthly updates" ON public.monthly_updates;
DROP POLICY IF EXISTS "Users can delete own monthly updates" ON public.monthly_updates;

CREATE POLICY "Users can view own monthly updates"
  ON public.monthly_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly updates"
  ON public.monthly_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly updates"
  ON public.monthly_updates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly updates"
  ON public.monthly_updates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_updates_user_month 
  ON public.monthly_updates(user_id, month DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_monthly_updates_updated_at ON public.monthly_updates;
CREATE TRIGGER update_monthly_updates_updated_at
  BEFORE UPDATE ON public.monthly_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.monthly_updates IS 'Monthly financial review checklists to ensure data is kept current';
COMMENT ON COLUMN public.monthly_updates.month IS 'First day of the month this review covers';
COMMENT ON COLUMN public.monthly_updates.status IS 'pending = not started, in_progress = partially done, completed = all items checked';
