-- Create portfolio_status table for MT4/MT5 portfolio updates
-- This table stores the latest portfolio status for each trading account

CREATE TABLE IF NOT EXISTS portfolio_status (
  -- Primary key: account number from MT4/MT5
  account_number BIGINT PRIMARY KEY,

  -- Portfolio metrics
  balance DECIMAL(15, 2),
  equity DECIMAL(15, 2),
  profit DECIMAL(15, 2),

  -- Server time from MT4/MT5
  server_time TIMESTAMP,

  -- Automatic timestamp tracking
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on last_updated for efficient queries
CREATE INDEX IF NOT EXISTS idx_portfolio_status_last_updated
  ON portfolio_status(last_updated DESC);

-- Add comment to table
COMMENT ON TABLE portfolio_status IS 'Stores the latest portfolio status for each MT4/MT5 trading account';

-- Add Row Level Security (RLS) policies
ALTER TABLE portfolio_status ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for the API)
CREATE POLICY "Service role can manage portfolio_status"
  ON portfolio_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view their own portfolio data
-- Note: You'll need to add a user_id column if you want to link accounts to users
-- For now, this allows any authenticated user to read all portfolio data
CREATE POLICY "Authenticated users can view portfolio_status"
  ON portfolio_status
  FOR SELECT
  TO authenticated
  USING (true);
