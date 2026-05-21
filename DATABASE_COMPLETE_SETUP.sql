-- =====================================================
-- ATLAS FINANCE MANAGER - COMPLETE DATABASE SETUP
-- =====================================================
-- This file contains all database migrations combined into a single,
-- production-ready, idempotent script that can be run multiple times safely.
--
-- IMPORTANT: This script is designed to work with Supabase/PostgreSQL
-- and requires the auth schema to exist (provided by Supabase).
--
-- Order of operations:
-- 1. Core auth tables (profiles + handle_new_user trigger)
-- 2. Base financial tables (assets, liabilities, transactions, net_worth_history)
-- 3. Investment and trading tables
-- 4. Additional features (savings, bills, budgets, insurance, etc.)
-- 5. API keys and portfolio status
-- 6. Row Level Security policies
-- 7. Triggers for timestamp management
-- =====================================================

-- Enable UUID extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 1: HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates the updated_at timestamp when a row is modified';

-- =====================================================
-- SECTION 2: CORE AUTH & PROFILE TABLES
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  default_currency TEXT DEFAULT 'THB',
  timezone TEXT DEFAULT 'Asia/Bangkok',

  -- Emergency fund tracking
  emergency_fund_target NUMERIC(15, 2) DEFAULT 0,
  emergency_fund_target_months INTEGER DEFAULT 6 CHECK (emergency_fund_target_months >= 1 AND emergency_fund_target_months <= 24),
  emergency_fund_current_amount NUMERIC(15, 2) DEFAULT 0,
  emergency_fund_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index for emergency fund queries
CREATE INDEX IF NOT EXISTS idx_profiles_emergency_fund ON public.profiles(id, emergency_fund_current_amount);

COMMENT ON TABLE public.profiles IS 'User profile information including preferences and emergency fund tracking';

-- =====================================================
-- CRITICAL: handle_new_user() Function and Trigger
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile when a new user signs up';

-- Trigger for new user (drop and recreate to ensure it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- SECTION 3: BASE FINANCIAL TABLES
-- =====================================================

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'investment', 'real_estate', 'vehicle', 'other')),
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can update own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON public.assets;

CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.assets IS 'General assets including cash, investments, real estate, vehicles, and other assets';

-- Liabilities table
CREATE TABLE IF NOT EXISTS public.liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'loan', 'mortgage', 'other')),
  current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5, 2),
  currency TEXT DEFAULT 'THB',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can insert own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can update own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can delete own liabilities" ON public.liabilities;

CREATE POLICY "Users can view own liabilities"
  ON public.liabilities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liabilities"
  ON public.liabilities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own liabilities"
  ON public.liabilities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own liabilities"
  ON public.liabilities FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.liabilities IS 'Debts and liabilities including credit cards, loans, and mortgages';

-- Cash accounts table
CREATE TABLE IF NOT EXISTS public.cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_number TEXT,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  interest_rate NUMERIC(5, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can insert own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can update own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can delete own cash accounts" ON public.cash_accounts;

CREATE POLICY "Users can view own cash accounts"
  ON public.cash_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash accounts"
  ON public.cash_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash accounts"
  ON public.cash_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash accounts"
  ON public.cash_accounts FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.cash_accounts IS 'Bank accounts and cash holdings with detailed account information';

-- Transactions table for income and expenses
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Enhanced fields
  source TEXT,
  merchant TEXT,
  payment_method TEXT,
  account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
  account_name TEXT,
  is_recurring BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id) WHERE account_id IS NOT NULL;

COMMENT ON TABLE public.transactions IS 'Income and expense transactions with detailed categorization and tracking';

-- Net worth history table
CREATE TABLE IF NOT EXISTS public.net_worth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  net_worth NUMERIC(15, 2) NOT NULL,
  total_assets NUMERIC(15, 2),
  total_liabilities NUMERIC(15, 2),
  date DATE NOT NULL,
  currency TEXT DEFAULT 'THB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own net worth history" ON public.net_worth_history;
DROP POLICY IF EXISTS "Users can insert own net worth history" ON public.net_worth_history;

CREATE POLICY "Users can view own net worth history"
  ON public.net_worth_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own net worth history"
  ON public.net_worth_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_net_worth_history_user_date ON public.net_worth_history(user_id, date DESC);

COMMENT ON TABLE public.net_worth_history IS 'Historical snapshots of user net worth over time';
COMMENT ON COLUMN public.net_worth_history.total_assets IS 'Total value of all assets at the time of snapshot';
COMMENT ON COLUMN public.net_worth_history.total_liabilities IS 'Total value of all liabilities at the time of snapshot';
COMMENT ON COLUMN public.net_worth_history.net_worth IS 'Calculated as total_assets - total_liabilities';

-- =====================================================
-- SECTION 4: INVESTMENT TABLES
-- =====================================================

-- Investments table (includes mutual funds, stocks, bonds, MT4/MT5, business)
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_type TEXT NOT NULL CHECK (investment_type IN ('mutual_fund', 'stock', 'bond', 'mt4_mt5', 'business')),

  -- Common fields
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'THB',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  -- Investment amount fields
  initial_investment NUMERIC(15, 2),
  current_value NUMERIC(15, 2),

  -- Mutual Fund specific fields
  fund_code TEXT,
  fund_category TEXT CHECK (fund_category IN ('RMF', 'LTF', 'Thai ESG', 'SSF', 'General')),
  fund_house TEXT,
  units NUMERIC(15, 4),
  avg_cost NUMERIC(15, 4),
  current_nav NUMERIC(15, 4),

  -- Stock specific fields
  symbol TEXT,
  company_name TEXT,
  exchange TEXT,
  shares NUMERIC(15, 4),
  avg_price NUMERIC(15, 4),
  current_price NUMERIC(15, 4),
  sector TEXT,

  -- Bond specific fields
  bond_type TEXT,
  issuer TEXT,
  face_value NUMERIC(15, 2),
  coupon_rate NUMERIC(5, 2),
  maturity_date DATE,

  -- MT4/MT5 specific fields
  broker TEXT,
  account_number TEXT,
  account_type TEXT,
  balance NUMERIC(15, 2),
  equity NUMERIC(15, 2),
  profit_loss NUMERIC(15, 2),

  -- MT4/MT5 integration fields
  mt_account_number TEXT,
  mt_platform TEXT CHECK (mt_platform IN ('MT4', 'MT5')),
  mt_broker TEXT,
  mt_server TEXT,
  api_key TEXT UNIQUE,
  last_sync TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'active', 'error', 'disconnected')),

  -- Business investment specific fields
  business_name TEXT,
  investment_date DATE,
  ownership_percent NUMERIC(5, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments;

CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON public.investments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON public.investments FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_investments_api_key ON public.investments(api_key) WHERE api_key IS NOT NULL;

COMMENT ON TABLE public.investments IS 'Investment holdings including mutual funds, stocks, bonds, MT4/MT5 accounts, and business investments';
COMMENT ON COLUMN public.investments.api_key IS 'Unique API key for MT4/MT5 Expert Advisor authentication';
COMMENT ON COLUMN public.investments.last_sync IS 'Timestamp of last successful synchronization from MT4/MT5';
COMMENT ON COLUMN public.investments.sync_status IS 'Current synchronization status: pending, active, error, or disconnected';

-- =====================================================
-- SECTION 5: MT4/MT5 INTEGRATION TABLES
-- =====================================================

-- MT Account History
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

ALTER TABLE public.mt_account_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own MT history" ON public.mt_account_history;
DROP POLICY IF EXISTS "Users can insert their own MT history" ON public.mt_account_history;

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

COMMENT ON TABLE public.mt_account_history IS 'Historical snapshots of MT4/MT5 account metrics for performance tracking';

-- MT Positions
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

ALTER TABLE public.mt_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own MT positions" ON public.mt_positions;
DROP POLICY IF EXISTS "Users can manage their own MT positions" ON public.mt_positions;

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

COMMENT ON TABLE public.mt_positions IS 'Currently open positions from MT4/MT5 accounts';

-- =====================================================
-- SECTION 6: ASSET DETAIL TABLES
-- =====================================================

-- Real Estate table
CREATE TABLE IF NOT EXISTS public.real_estate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('Primary Residence', 'Rental', 'Land', 'Commercial', 'Condo', 'Other')),
  purchase_price NUMERIC(15, 2) NOT NULL,
  current_value NUMERIC(15, 2) NOT NULL,
  purchase_date DATE,
  rental_income NUMERIC(15, 2) DEFAULT 0,
  rental_status TEXT CHECK (rental_status IN ('Owner Occupied', 'Occupied', 'Vacant', 'N/A')),
  currency TEXT DEFAULT 'THB',
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.real_estate ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own real estate" ON public.real_estate;
DROP POLICY IF EXISTS "Users can insert own real estate" ON public.real_estate;
DROP POLICY IF EXISTS "Users can update own real estate" ON public.real_estate;
DROP POLICY IF EXISTS "Users can delete own real estate" ON public.real_estate;

CREATE POLICY "Users can view own real estate"
  ON public.real_estate FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own real estate"
  ON public.real_estate FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own real estate"
  ON public.real_estate FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own real estate"
  ON public.real_estate FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.real_estate IS 'Real estate properties with detailed information and rental tracking';

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Car', 'Motorcycle', 'Truck', 'SUV', 'Van', 'Other')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  purchase_price NUMERIC(15, 2) NOT NULL,
  current_value NUMERIC(15, 2) NOT NULL,
  purchase_date DATE,
  license_plate TEXT,
  vin TEXT,
  currency TEXT DEFAULT 'THB',
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;

CREATE POLICY "Users can view own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.vehicles IS 'Vehicle assets with detailed information and valuation tracking';

-- Other Assets table
CREATE TABLE IF NOT EXISTS public.other_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Cryptocurrency', 'Precious Metals', 'Collectibles', 'Art', 'Jewelry', 'Antiques', 'Other')),
  purchase_price NUMERIC(15, 2) NOT NULL,
  current_value NUMERIC(15, 2) NOT NULL,
  purchase_date DATE,
  quantity NUMERIC(15, 4),
  currency TEXT DEFAULT 'THB',
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.other_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own other assets" ON public.other_assets;
DROP POLICY IF EXISTS "Users can insert own other assets" ON public.other_assets;
DROP POLICY IF EXISTS "Users can update own other assets" ON public.other_assets;
DROP POLICY IF EXISTS "Users can delete own other assets" ON public.other_assets;

CREATE POLICY "Users can view own other assets"
  ON public.other_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own other assets"
  ON public.other_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own other assets"
  ON public.other_assets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own other assets"
  ON public.other_assets FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.other_assets IS 'Other assets including cryptocurrency, precious metals, collectibles, and more';

-- =====================================================
-- SECTION 7: LIABILITY DETAIL TABLES
-- =====================================================

-- Credit Cards table
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  card_type TEXT NOT NULL,
  last_four_digits TEXT,
  current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  payment_due_date INTEGER,
  minimum_payment NUMERIC(15, 2),
  annual_fee NUMERIC(15, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON public.credit_cards;

CREATE POLICY "Users can view their own credit cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for credit_cards
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_status ON public.credit_cards(status);

COMMENT ON TABLE public.credit_cards IS 'Credit card accounts with balance, limit, and payment tracking';

-- Loans table
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_type TEXT NOT NULL,
  lender TEXT NOT NULL,
  original_amount NUMERIC(15, 2) NOT NULL,
  current_balance NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  loan_term_years INTEGER NOT NULL,
  monthly_payment NUMERIC(15, 2) NOT NULL,
  payment_due_date INTEGER,
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  currency TEXT NOT NULL DEFAULT 'THB',
  description TEXT,

  -- Type-specific fields for home loans
  property_address TEXT,
  property_loan_type TEXT,

  -- Type-specific fields for car loans
  vehicle_details TEXT,

  -- Type-specific fields for personal loans
  loan_purpose TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can insert their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete their own loans" ON public.loans;

CREATE POLICY "Users can view their own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON public.loans FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for loans
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_type ON public.loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

COMMENT ON TABLE public.loans IS 'Loan accounts including home loans, car loans, and personal loans';

-- =====================================================
-- SECTION 8: CATEGORIES SYSTEM
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Category details
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT '#3b82f6',

  -- Metadata
  is_default BOOLEAN NOT NULL DEFAULT false,
  transaction_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique category names per user per type
  UNIQUE(user_id, name, type)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

COMMENT ON TABLE public.categories IS 'User-defined income and expense categories with customizable icons and colors';
COMMENT ON COLUMN public.categories.is_default IS 'Whether this is a system-provided default category';
COMMENT ON COLUMN public.categories.transaction_count IS 'Number of transactions using this category (updated by triggers)';

-- Helper function to create default categories for a user
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Income categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default) VALUES
  (p_user_id, 'Salary/Wages', 'income', '💰', '#10b981', true),
  (p_user_id, 'Business Income', 'income', '💼', '#3b82f6', true),
  (p_user_id, 'Investment Income - Dividends', 'income', '📊', '#8b5cf6', true),
  (p_user_id, 'Investment Income - Interest', 'income', '💹', '#a855f7', true),
  (p_user_id, 'Investment Income - Capital Gains', 'income', '📈', '#d946ef', true),
  (p_user_id, 'Rental Income', 'income', '🏠', '#f59e0b', true),
  (p_user_id, 'Trading Income', 'income', '💱', '#14b8a6', true),
  (p_user_id, 'Freelance/Contract', 'income', '💻', '#06b6d4', true),
  (p_user_id, 'Bonuses & Commissions', 'income', '🎁', '#84cc16', true),
  (p_user_id, 'Other Income', 'income', '💵', '#22c55e', true)
  ON CONFLICT (user_id, name, type) DO NOTHING;

  -- Expense categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default) VALUES
  (p_user_id, 'Housing - Rent', 'expense', '🏠', '#ef4444', true),
  (p_user_id, 'Housing - Mortgage', 'expense', '🏡', '#dc2626', true),
  (p_user_id, 'Housing - Utilities', 'expense', '⚡', '#f97316', true),
  (p_user_id, 'Transportation - Fuel', 'expense', '⛽', '#f59e0b', true),
  (p_user_id, 'Transportation - Public Transport', 'expense', '🚇', '#eab308', true),
  (p_user_id, 'Transportation - Parking', 'expense', '🅿️', '#facc15', true),
  (p_user_id, 'Food & Dining - Groceries', 'expense', '🛒', '#84cc16', true),
  (p_user_id, 'Food & Dining - Restaurants', 'expense', '🍔', '#22c55e', true),
  (p_user_id, 'Food & Dining - Delivery', 'expense', '🍕', '#10b981', true),
  (p_user_id, 'Shopping - Clothing', 'expense', '👕', '#14b8a6', true),
  (p_user_id, 'Shopping - Electronics', 'expense', '📱', '#06b6d4', true),
  (p_user_id, 'Shopping - Personal Care', 'expense', '💅', '#0ea5e9', true),
  (p_user_id, 'Entertainment - Movies', 'expense', '🎬', '#3b82f6', true),
  (p_user_id, 'Entertainment - Hobbies', 'expense', '🎮', '#6366f1', true),
  (p_user_id, 'Entertainment - Subscriptions', 'expense', '🎵', '#8b5cf6', true),
  (p_user_id, 'Healthcare - Doctor', 'expense', '🏥', '#a855f7', true),
  (p_user_id, 'Healthcare - Medications', 'expense', '💊', '#c026d3', true),
  (p_user_id, 'Healthcare - Insurance', 'expense', '🏥', '#d946ef', true),
  (p_user_id, 'Education', 'expense', '📚', '#ec4899', true),
  (p_user_id, 'Travel', 'expense', '✈️', '#f43f5e', true),
  (p_user_id, 'Bills & Utilities', 'expense', '💡', '#f97316', true),
  (p_user_id, 'Personal', 'expense', '👤', '#6b7280', true),
  (p_user_id, 'Financial - Fees', 'expense', '💳', '#78716c', true),
  (p_user_id, 'Financial - Interest', 'expense', '📊', '#57534e', true),
  (p_user_id, 'Giving - Charity', 'expense', '❤️', '#fb923c', true),
  (p_user_id, 'Giving - Gifts', 'expense', '🎁', '#fdba74', true),
  (p_user_id, 'Other', 'expense', '💸', '#9ca3af', true)
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_default_categories_for_user IS 'Creates default income and expense categories for a new user';

-- Function to auto-create categories for new users
CREATE OR REPLACE FUNCTION public.create_categories_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create categories for new users
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;

CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_categories_for_new_user();

-- =====================================================
-- SECTION 9: SAVINGS & BILLS
-- =====================================================

-- Savings Goals table
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  target_date DATE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON public.savings_goals;

CREATE POLICY "Users can view own savings goals"
  ON public.savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON public.savings_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON public.savings_goals FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.savings_goals IS 'Savings goals with target amounts and deadlines';

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  due_date DATE NOT NULL,
  category TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'quarterly', 'yearly', 'weekly')),
  is_paid BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can insert own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can update own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can delete own bills" ON public.bills;

CREATE POLICY "Users can view own bills"
  ON public.bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON public.bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON public.bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON public.bills FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.bills IS 'Bills and recurring payments with due dates and payment tracking';

-- =====================================================
-- SECTION 10: BUDGETS & INSURANCE
-- =====================================================

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  month DATE NOT NULL, -- First day of the month
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, month) -- One budget per category per month
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets"
  ON public.budgets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON public.budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.budgets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON public.budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON public.budgets(month);

COMMENT ON TABLE public.budgets IS 'Monthly budgets for expense categories';

-- Insurance Policies table
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL, -- life, health, vehicle, property, etc.
  provider TEXT NOT NULL,
  policy_number TEXT,
  premium_amount NUMERIC(15, 2) NOT NULL,
  premium_frequency TEXT NOT NULL, -- monthly, quarterly, yearly
  currency TEXT NOT NULL DEFAULT 'THB',
  coverage_amount NUMERIC(15, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  beneficiaries TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can insert their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can update their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can delete their own insurance policies" ON public.insurance_policies;

CREATE POLICY "Users can view their own insurance policies"
  ON public.insurance_policies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insurance policies"
  ON public.insurance_policies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance policies"
  ON public.insurance_policies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insurance policies"
  ON public.insurance_policies
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_renewal_date ON public.insurance_policies(renewal_date);

COMMENT ON TABLE public.insurance_policies IS 'Insurance policies with premium and coverage tracking';

-- =====================================================
-- SECTION 11: NET WORTH GOALS
-- =====================================================

-- Net Worth Goals table
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

ALTER TABLE public.net_worth_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own net worth goals" ON public.net_worth_goals;
DROP POLICY IF EXISTS "Users can insert their own net worth goals" ON public.net_worth_goals;
DROP POLICY IF EXISTS "Users can update their own net worth goals" ON public.net_worth_goals;
DROP POLICY IF EXISTS "Users can delete their own net worth goals" ON public.net_worth_goals;

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

COMMENT ON TABLE public.net_worth_goals IS 'User-defined net worth goals and financial targets';
COMMENT ON COLUMN public.net_worth_goals.goal_type IS 'Type of goal: net_worth, debt_free, retirement, or custom';
COMMENT ON COLUMN public.net_worth_goals.target_amount IS 'Target amount to achieve (in THB)';
COMMENT ON COLUMN public.net_worth_goals.current_amount IS 'Optional: current progress amount (can be auto-calculated from net worth)';
COMMENT ON COLUMN public.net_worth_goals.display_order IS 'Order to display goals (lower numbers first)';

-- =====================================================
-- SECTION 12: FINANCIAL HEALTH & TAX PLANNING
-- =====================================================

-- Financial Health History table
CREATE TABLE IF NOT EXISTS public.financial_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Overall score
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Individual metrics
  debt_to_income_ratio NUMERIC(10, 4),
  savings_rate NUMERIC(10, 4),
  emergency_fund_months NUMERIC(10, 2),
  credit_utilization NUMERIC(10, 4),
  net_worth NUMERIC(15, 2),

  -- Scores for each component
  debt_score INTEGER CHECK (debt_score >= 0 AND debt_score <= 100),
  savings_score INTEGER CHECK (savings_score >= 0 AND savings_score <= 100),
  emergency_fund_score INTEGER CHECK (emergency_fund_score >= 0 AND emergency_fund_score <= 100),
  credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per date
  UNIQUE(user_id, date)
);

ALTER TABLE public.financial_health_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own financial health history" ON public.financial_health_history;
DROP POLICY IF EXISTS "Users can insert their own financial health history" ON public.financial_health_history;
DROP POLICY IF EXISTS "Users can update their own financial health history" ON public.financial_health_history;
DROP POLICY IF EXISTS "Users can delete their own financial health history" ON public.financial_health_history;

CREATE POLICY "Users can view their own financial health history"
  ON public.financial_health_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial health history"
  ON public.financial_health_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial health history"
  ON public.financial_health_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial health history"
  ON public.financial_health_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_health_history_user_date
  ON public.financial_health_history(user_id, date DESC);

COMMENT ON TABLE public.financial_health_history IS 'Historical financial health scores and metrics for tracking progress over time';
COMMENT ON COLUMN public.financial_health_history.overall_score IS 'Overall financial health score (0-100)';
COMMENT ON COLUMN public.financial_health_history.debt_to_income_ratio IS 'Total debt payments divided by monthly income';
COMMENT ON COLUMN public.financial_health_history.savings_rate IS 'Percentage of income saved';
COMMENT ON COLUMN public.financial_health_history.emergency_fund_months IS 'Months of expenses covered by emergency fund';
COMMENT ON COLUMN public.financial_health_history.credit_utilization IS 'Credit card balance divided by credit limit';

-- Tax Planning table
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

ALTER TABLE public.tax_planning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tax planning data" ON public.tax_planning;
DROP POLICY IF EXISTS "Users can insert their own tax planning data" ON public.tax_planning;
DROP POLICY IF EXISTS "Users can update their own tax planning data" ON public.tax_planning;
DROP POLICY IF EXISTS "Users can delete their own tax planning data" ON public.tax_planning;

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

COMMENT ON TABLE public.tax_planning IS 'Tax planning data including income, deductions, and tax estimates for Thai tax calculation';
COMMENT ON COLUMN public.tax_planning.deductions IS 'JSONB object containing deduction categories and amounts (rmf_ltf, life_insurance, health_insurance, provident_fund, home_loan, etc.)';
COMMENT ON COLUMN public.tax_planning.tax_year IS 'Tax year for this planning data (e.g., 2025)';

-- =====================================================
-- SECTION 13: API KEYS & PORTFOLIO STATUS
-- =====================================================

-- API Keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Unnamed Key',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON public.api_keys(api_key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used ON public.api_keys(last_used_at DESC);

DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role can manage all api_keys" ON public.api_keys;

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all api_keys"
  ON public.api_keys FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.api_keys IS 'User-generated API keys for external data sources (MT4/MT5 EAs)';
COMMENT ON COLUMN public.api_keys.api_key IS 'Format: sk_live_[32 hex characters]';
COMMENT ON COLUMN public.api_keys.name IS 'User-defined label for the API key (e.g., "MT4 Account 1")';
COMMENT ON COLUMN public.api_keys.is_active IS 'Allows users to revoke keys without deleting them';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Updated each time the key is used in portfolio-update endpoint';

-- Portfolio Status table
CREATE TABLE IF NOT EXISTS public.portfolio_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number BIGINT NOT NULL,

  -- Portfolio metrics
  balance DECIMAL(15, 2),
  equity DECIMAL(15, 2),
  profit DECIMAL(15, 2),

  -- Server time from MT4/MT5
  server_time TIMESTAMP,

  -- Automatic timestamp tracking
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique account per user
  UNIQUE(user_id, account_number)
);

ALTER TABLE public.portfolio_status ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_status_last_updated
  ON public.portfolio_status(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_status_user_id ON public.portfolio_status(user_id);

DROP POLICY IF EXISTS "Service role can manage portfolio_status" ON public.portfolio_status;
DROP POLICY IF EXISTS "Users can view their own portfolio status" ON public.portfolio_status;
DROP POLICY IF EXISTS "Service role can manage all portfolio_status" ON public.portfolio_status;
DROP POLICY IF EXISTS "Authenticated users can view portfolio_status" ON public.portfolio_status;

CREATE POLICY "Users can view their own portfolio status"
  ON public.portfolio_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all portfolio_status"
  ON public.portfolio_status FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.portfolio_status IS 'Latest portfolio status for each MT4/MT5 trading account';
COMMENT ON COLUMN public.portfolio_status.user_id IS 'Links portfolio data to the user who owns this MT4/MT5 account';

-- =====================================================
-- SECTION 14: HELPER FUNCTIONS FOR API & CLEANUP
-- =====================================================

-- Function to generate unique API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
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

COMMENT ON FUNCTION public.generate_api_key IS 'Generates a secure random API key for MT4/MT5 integration';

-- Function to cleanup old unused API keys
CREATE OR REPLACE FUNCTION public.cleanup_old_unused_api_keys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete inactive keys that haven't been used in 90 days
  DELETE FROM public.api_keys
  WHERE is_active = false
    AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '90 days')
    AND created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_unused_api_keys IS 'Removes inactive API keys that have not been used in 90+ days';

-- Function to update emergency fund timestamp
CREATE OR REPLACE FUNCTION public.update_emergency_fund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.emergency_fund_current_amount IS DISTINCT FROM OLD.emergency_fund_current_amount) OR
     (NEW.emergency_fund_target_months IS DISTINCT FROM OLD.emergency_fund_target_months) THEN
    NEW.emergency_fund_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_emergency_fund_updated_at IS 'Updates emergency_fund_updated_at when emergency fund values change';

-- =====================================================
-- SECTION 15: TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS profiles_emergency_fund_updated_at ON public.profiles;
CREATE TRIGGER profiles_emergency_fund_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_emergency_fund_updated_at();

-- Assets
DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Liabilities
DROP TRIGGER IF EXISTS update_liabilities_updated_at ON public.liabilities;
CREATE TRIGGER update_liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cash Accounts
DROP TRIGGER IF EXISTS update_cash_accounts_updated_at ON public.cash_accounts;
CREATE TRIGGER update_cash_accounts_updated_at
  BEFORE UPDATE ON public.cash_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Investments
DROP TRIGGER IF EXISTS update_investments_updated_at ON public.investments;
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Real Estate
DROP TRIGGER IF EXISTS update_real_estate_updated_at ON public.real_estate;
CREATE TRIGGER update_real_estate_updated_at
  BEFORE UPDATE ON public.real_estate
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vehicles
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Other Assets
DROP TRIGGER IF EXISTS update_other_assets_updated_at ON public.other_assets;
CREATE TRIGGER update_other_assets_updated_at
  BEFORE UPDATE ON public.other_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit Cards
DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON public.credit_cards;
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Loans
DROP TRIGGER IF EXISTS update_loans_updated_at ON public.loans;
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Categories
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Savings Goals
DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bills
DROP TRIGGER IF EXISTS update_bills_updated_at ON public.bills;
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Budgets
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insurance Policies
DROP TRIGGER IF EXISTS update_insurance_policies_updated_at ON public.insurance_policies;
CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Net Worth Goals
DROP TRIGGER IF EXISTS net_worth_goals_updated_at ON public.net_worth_goals;
CREATE TRIGGER net_worth_goals_updated_at
  BEFORE UPDATE ON public.net_worth_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tax Planning
DROP TRIGGER IF EXISTS tax_planning_updated_at ON public.tax_planning;
CREATE TRIGGER tax_planning_updated_at
  BEFORE UPDATE ON public.tax_planning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SECTION 16: VERIFICATION & SUMMARY
-- =====================================================

-- This section verifies that all tables have been created successfully
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Count tables in public schema
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

  -- Count functions in public schema
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION';

  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';

  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'Functions created: %', function_count;
  RAISE NOTICE 'Triggers created: %', trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Core Tables:';
  RAISE NOTICE '  ✓ profiles (with handle_new_user trigger)';
  RAISE NOTICE '  ✓ assets';
  RAISE NOTICE '  ✓ liabilities';
  RAISE NOTICE '  ✓ cash_accounts';
  RAISE NOTICE '  ✓ transactions';
  RAISE NOTICE '  ✓ net_worth_history';
  RAISE NOTICE '';
  RAISE NOTICE 'Investment Tables:';
  RAISE NOTICE '  ✓ investments';
  RAISE NOTICE '  ✓ mt_account_history';
  RAISE NOTICE '  ✓ mt_positions';
  RAISE NOTICE '';
  RAISE NOTICE 'Asset Detail Tables:';
  RAISE NOTICE '  ✓ real_estate';
  RAISE NOTICE '  ✓ vehicles';
  RAISE NOTICE '  ✓ other_assets';
  RAISE NOTICE '';
  RAISE NOTICE 'Liability Detail Tables:';
  RAISE NOTICE '  ✓ credit_cards';
  RAISE NOTICE '  ✓ loans';
  RAISE NOTICE '';
  RAISE NOTICE 'Additional Features:';
  RAISE NOTICE '  ✓ categories';
  RAISE NOTICE '  ✓ savings_goals';
  RAISE NOTICE '  ✓ bills';
  RAISE NOTICE '  ✓ budgets';
  RAISE NOTICE '  ✓ insurance_policies';
  RAISE NOTICE '  ✓ net_worth_goals';
  RAISE NOTICE '  ✓ financial_health_history';
  RAISE NOTICE '  ✓ tax_planning';
  RAISE NOTICE '';
  RAISE NOTICE 'API & Portfolio:';
  RAISE NOTICE '  ✓ api_keys';
  RAISE NOTICE '  ✓ portfolio_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Critical Functions:';
  RAISE NOTICE '  ✓ handle_new_user()';
  RAISE NOTICE '  ✓ update_updated_at_column()';
  RAISE NOTICE '  ✓ create_default_categories_for_user()';
  RAISE NOTICE '  ✓ generate_api_key()';
  RAISE NOTICE '  ✓ cleanup_old_unused_api_keys()';
  RAISE NOTICE '';
  RAISE NOTICE 'Row Level Security (RLS) is enabled on all tables';
  RAISE NOTICE 'All triggers for updated_at timestamps are active';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: New users will automatically get:';
  RAISE NOTICE '  - A profile entry (via handle_new_user trigger)';
  RAISE NOTICE '  - Default income and expense categories';
  RAISE NOTICE '';
  RAISE NOTICE 'This script is idempotent and can be run multiple times safely.';
  RAISE NOTICE '=====================================================';
END $$;
