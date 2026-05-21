-- ========================================
-- ATLAS FINANCIAL MANAGEMENT - COMPLETE MIGRATION SCRIPT
-- Apply this in Supabase SQL Editor
-- ========================================

-- Step 1: Check what tables already exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tables...';

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bills') THEN
        RAISE NOTICE '✓ bills table exists';
    ELSE
        RAISE NOTICE '✗ bills table missing - will be created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'savings_goals') THEN
        RAISE NOTICE '✓ savings_goals table exists';
    ELSE
        RAISE NOTICE '✗ savings_goals table missing - will be created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
        RAISE NOTICE '✓ budgets table exists';
    ELSE
        RAISE NOTICE '✗ budgets table missing - will be created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'insurance_policies') THEN
        RAISE NOTICE '✓ insurance_policies table exists';
    ELSE
        RAISE NOTICE '✗ insurance_policies table missing - will be created';
    END IF;
END $$;

-- ========================================
-- MIGRATION 1: Savings Goals & Bills
-- ========================================

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  target_amount numeric(15,2) not null,
  current_amount numeric(15,2) not null default 0,
  currency text default 'THB',
  target_date date,
  category text,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
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

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  amount numeric(15,2) not null,
  currency text default 'THB',
  due_date date not null,
  category text,
  is_recurring boolean default false,
  recurrence_period text check (recurrence_period in ('monthly', 'quarterly', 'yearly', 'weekly')),
  is_paid boolean default false,
  description text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Add emergency_fund_target to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'emergency_fund_target'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN emergency_fund_target numeric(15,2) default 0;
    END IF;
END $$;

-- ========================================
-- MIGRATION 2: Budgets & Insurance
-- ========================================

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  month DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Create insurance_policies table
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  policy_number TEXT,
  premium_amount NUMERIC(15, 2) NOT NULL,
  premium_frequency TEXT NOT NULL,
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can insert their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can update their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can delete their own insurance policies" ON public.insurance_policies;

CREATE POLICY "Users can view their own insurance policies"
  ON public.insurance_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insurance policies"
  ON public.insurance_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insurance policies"
  ON public.insurance_policies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insurance policies"
  ON public.insurance_policies FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON public.budgets(month);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_renewal_date ON public.insurance_policies(renewal_date);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON public.bills;
CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_insurance_policies_updated_at ON public.insurance_policies;
CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION: Check that all tables were created
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETE - Verifying tables...';
    RAISE NOTICE '========================================';

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bills') THEN
        RAISE NOTICE '✓ bills table created successfully';
    ELSE
        RAISE EXCEPTION '✗ bills table failed to create';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'savings_goals') THEN
        RAISE NOTICE '✓ savings_goals table created successfully';
    ELSE
        RAISE EXCEPTION '✗ savings_goals table failed to create';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
        RAISE NOTICE '✓ budgets table created successfully';
    ELSE
        RAISE EXCEPTION '✗ budgets table failed to create';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'insurance_policies') THEN
        RAISE NOTICE '✓ insurance_policies table created successfully';
    ELSE
        RAISE EXCEPTION '✗ insurance_policies table failed to create';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'ALL TABLES CREATED SUCCESSFULLY! ✅';
    RAISE NOTICE 'Your app is now ready to use.';
    RAISE NOTICE '========================================';
END $$;
