-- =====================================================
-- NET WORTH GOALS TABLE
-- Track user-defined net worth goals and targets
-- =====================================================

CREATE TABLE IF NOT EXISTS public.net_worth_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  goal_name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount NUMERIC(15, 2) NOT NULL,
  target_date DATE,

  -- Goal type (e.g., 'net_worth', 'debt_free', 'retirement', 'custom')
  goal_type VARCHAR(50) DEFAULT 'net_worth',

  -- Optional: track current progress
  current_amount NUMERIC(15, 2),

  -- Status
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_date DATE,

  -- Display order
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.net_worth_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own net worth goals"
  ON public.net_worth_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own net worth goals"
  ON public.net_worth_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own net worth goals"
  ON public.net_worth_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own net worth goals"
  ON public.net_worth_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_net_worth_goals_user
  ON public.net_worth_goals(user_id, display_order);

CREATE INDEX IF NOT EXISTS idx_net_worth_goals_user_active
  ON public.net_worth_goals(user_id) WHERE is_achieved = FALSE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_net_worth_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER net_worth_goals_updated_at
  BEFORE UPDATE ON public.net_worth_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_net_worth_goals_updated_at();

-- Add comments
COMMENT ON TABLE public.net_worth_goals IS 'Stores user-defined net worth goals and financial targets';
COMMENT ON COLUMN public.net_worth_goals.goal_type IS 'Type of goal: net_worth, debt_free, retirement, or custom';
COMMENT ON COLUMN public.net_worth_goals.target_amount IS 'Target amount to achieve (in THB)';
COMMENT ON COLUMN public.net_worth_goals.current_amount IS 'Optional: current progress amount (can be auto-calculated from net worth)';
COMMENT ON COLUMN public.net_worth_goals.display_order IS 'Order to display goals (lower numbers first)';
