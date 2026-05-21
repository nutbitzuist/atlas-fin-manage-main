-- Migration: Create API Keys Management System
-- This migration creates the api_keys table and updates portfolio_status for multi-tenant support

-- ============================================
-- 1. CREATE API_KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Unnamed Key',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON api_keys(last_used_at DESC);

-- Add comment for documentation
COMMENT ON TABLE api_keys IS 'Stores user-generated API keys for external data sources (MT4/MT5 EAs)';
COMMENT ON COLUMN api_keys.api_key IS 'Format: sk_live_[32 hex characters]';
COMMENT ON COLUMN api_keys.name IS 'User-defined label for the API key (e.g., "MT4 Account 1")';
COMMENT ON COLUMN api_keys.is_active IS 'Allows users to revoke keys without deleting them';
COMMENT ON COLUMN api_keys.last_used_at IS 'Updated each time the key is used in portfolio-update endpoint';

-- ============================================
-- 2. UPDATE PORTFOLIO_STATUS TABLE
-- ============================================

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_status' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE portfolio_status ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop the old primary key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'portfolio_status'
    AND constraint_type = 'PRIMARY KEY'
    AND constraint_name = 'portfolio_status_pkey'
  ) THEN
    ALTER TABLE portfolio_status DROP CONSTRAINT portfolio_status_pkey;
  END IF;
END $$;

-- Add a new id column as primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portfolio_status' AND column_name = 'id'
  ) THEN
    ALTER TABLE portfolio_status ADD COLUMN id UUID DEFAULT gen_random_uuid();
    ALTER TABLE portfolio_status ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Create unique constraint on (user_id, account_number)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'portfolio_status'
    AND constraint_name = 'portfolio_status_user_account_unique'
  ) THEN
    ALTER TABLE portfolio_status ADD CONSTRAINT portfolio_status_user_account_unique
    UNIQUE (user_id, account_number);
  END IF;
END $$;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_status_user_id ON portfolio_status(user_id);

-- Update comment
COMMENT ON COLUMN portfolio_status.user_id IS 'Links portfolio data to the user who owns this MT4/MT5 account';
COMMENT ON CONSTRAINT portfolio_status_user_account_unique ON portfolio_status IS 'Each user can have unique account numbers';

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own API keys
CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys (for revoking/renaming)
CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all API keys (for Edge Functions)
CREATE POLICY "Service role can manage all api_keys"
  ON api_keys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update RLS policies for portfolio_status table
DROP POLICY IF EXISTS "Service role can manage portfolio_status" ON portfolio_status;

-- Policy: Users can view their own portfolio status
CREATE POLICY "Users can view their own portfolio status"
  ON portfolio_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all portfolio status (for Edge Functions)
CREATE POLICY "Service role can manage all portfolio_status"
  ON portfolio_status FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. HELPER FUNCTIONS (OPTIONAL)
-- ============================================

-- Function to automatically clean up old API keys (optional, can be called via cron)
CREATE OR REPLACE FUNCTION cleanup_old_unused_api_keys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete inactive keys that haven't been used in 90 days
  DELETE FROM api_keys
  WHERE is_active = false
    AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '90 days')
    AND created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION cleanup_old_unused_api_keys IS 'Removes inactive API keys that have not been used in 90+ days';
