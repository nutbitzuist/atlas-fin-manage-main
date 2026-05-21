-- =====================================================
-- MT4/MT5 INTEGRATION
-- Add support for automated trading account synchronization
-- =====================================================

-- Add MT4/MT5 specific fields to investments table
ALTER TABLE public.investments
ADD COLUMN IF NOT EXISTS mt_account_number TEXT,
ADD COLUMN IF NOT EXISTS mt_platform TEXT CHECK (mt_platform IN ('MT4', 'MT5')),
ADD COLUMN IF NOT EXISTS mt_broker TEXT,
ADD COLUMN IF NOT EXISTS mt_server TEXT,
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'active', 'error', 'disconnected'));

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_investments_api_key ON public.investments(api_key) WHERE api_key IS NOT NULL;

-- =====================================================
-- MT ACCOUNT HISTORY TABLE
-- Stores historical snapshots of MT4/MT5 account metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mt_account_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Account metrics
  balance NUMERIC(15, 2) NOT NULL,
  equity NUMERIC(15, 2) NOT NULL,
  margin NUMERIC(15, 2),
  free_margin NUMERIC(15, 2),
  margin_level NUMERIC(10, 2),

  -- Profit/Loss
  floating_pl NUMERIC(15, 2),
  realized_pl_today NUMERIC(15, 2),

  -- Statistics
  total_positions INTEGER DEFAULT 0,
  open_lots NUMERIC(10, 2),

  -- Timestamps
  account_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(investment_id, account_timestamp)
);

-- Enable Row Level Security
ALTER TABLE public.mt_account_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own MT history"
  ON public.mt_account_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MT history"
  ON public.mt_account_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mt_history_investment ON public.mt_account_history(investment_id);
CREATE INDEX IF NOT EXISTS idx_mt_history_timestamp ON public.mt_account_history(account_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mt_history_user_date ON public.mt_account_history(user_id, account_timestamp DESC);

-- =====================================================
-- MT POSITIONS TABLE
-- Stores currently open positions from MT4/MT5
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mt_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Position details
  ticket_number BIGINT NOT NULL,
  symbol TEXT NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('buy', 'sell')),
  lots NUMERIC(10, 2) NOT NULL,

  -- Prices
  open_price NUMERIC(15, 5) NOT NULL,
  current_price NUMERIC(15, 5),
  stop_loss NUMERIC(15, 5),
  take_profit NUMERIC(15, 5),

  -- Profit/Loss
  profit_loss NUMERIC(15, 2),
  swap NUMERIC(15, 2),
  commission NUMERIC(15, 2),

  -- Timestamps
  open_time TIMESTAMPTZ NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(investment_id, ticket_number)
);

-- Enable Row Level Security
ALTER TABLE public.mt_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own MT positions"
  ON public.mt_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own MT positions"
  ON public.mt_positions FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mt_positions_investment ON public.mt_positions(investment_id);
CREATE INDEX IF NOT EXISTS idx_mt_positions_symbol ON public.mt_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_mt_positions_user ON public.mt_positions(user_id);

-- =====================================================
-- HELPER FUNCTION: Generate unique API key
-- =====================================================
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key TEXT;
BEGIN
  -- Generate a secure random API key (32 characters)
  key := 'mtapi_' || encode(gen_random_bytes(24), 'base64');
  -- Remove any characters that might cause issues
  key := replace(key, '/', '_');
  key := replace(key, '+', '-');
  key := replace(key, '=', '');
  RETURN key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.mt_account_history IS 'Historical snapshots of MT4/MT5 account metrics for performance tracking';
COMMENT ON TABLE public.mt_positions IS 'Currently open positions from MT4/MT5 accounts';
COMMENT ON COLUMN public.investments.api_key IS 'Unique API key for MT4/MT5 Expert Advisor authentication';
COMMENT ON COLUMN public.investments.last_sync IS 'Timestamp of last successful synchronization from MT4/MT5';
COMMENT ON COLUMN public.investments.sync_status IS 'Current synchronization status: pending, active, error, or disconnected';
