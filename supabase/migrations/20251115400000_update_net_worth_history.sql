-- Add missing columns to net_worth_history table
ALTER TABLE public.net_worth_history
ADD COLUMN IF NOT EXISTS total_assets NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS total_liabilities NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'THB';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_date ON public.net_worth_history(user_id, date DESC);

-- Add helpful comment
COMMENT ON TABLE public.net_worth_history IS 'Stores historical snapshots of user net worth over time';
COMMENT ON COLUMN public.net_worth_history.total_assets IS 'Total value of all assets at the time of snapshot';
COMMENT ON COLUMN public.net_worth_history.total_liabilities IS 'Total value of all liabilities at the time of snapshot';
COMMENT ON COLUMN public.net_worth_history.net_worth IS 'Calculated as total_assets - total_liabilities';
