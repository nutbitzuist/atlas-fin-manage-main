-- ========================================
-- ATLAS FINANCIAL MANAGEMENT
-- COMPLETE DATABASE SETUP FOR NEW PROJECT
-- ========================================
-- Run this entire script in your new Supabase project's SQL Editor
-- This combines all migrations into one file
-- ========================================

-- ========================================
-- PART 1: Base Schema (Profiles, Assets, Liabilities, Transactions)
-- ========================================

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  default_currency text DEFAULT 'THB',
  timezone text DEFAULT 'Asia/Bangkok',
  emergency_fund_target numeric(15,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create assets table
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'investment', 'real_estate', 'vehicle', 'other')),
  current_value numeric(15,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'THB',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

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

-- Create liabilities table
CREATE TABLE public.liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('credit_card', 'loan', 'mortgage', 'other')),
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  interest_rate numeric(5,2),
  currency text DEFAULT 'THB',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

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

-- Create transactions table for income and expenses
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'THB',
  description text,
  transaction_date date NOT NULL DEFAULT current_date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

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

-- Create net worth history table
CREATE TABLE public.net_worth_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  net_worth numeric(15,2) NOT NULL,
  date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.net_worth_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own net worth history"
  ON public.net_worth_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own net worth history"
  ON public.net_worth_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Add triggers for updated_at on base tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- PART 2: Savings Goals & Bills
-- ========================================

-- Create savings_goals table
CREATE TABLE public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(15,2) NOT NULL,
  current_amount numeric(15,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'THB',
  target_date date,
  category text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

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
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'THB',
  due_date date NOT NULL,
  category text,
  is_recurring boolean DEFAULT false,
  recurrence_period text CHECK (recurrence_period IN ('monthly', 'quarterly', 'yearly', 'weekly')),
  is_paid boolean DEFAULT false,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

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

-- Add triggers for savings_goals and bills
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- PART 3: Budgets & Insurance
-- ========================================

-- Create budgets table
CREATE TABLE public.budgets (
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
CREATE TABLE public.insurance_policies (
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
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_month ON public.budgets(month);
CREATE INDEX idx_insurance_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_renewal_date ON public.insurance_policies(renewal_date);

-- Add triggers for budgets and insurance
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SETUP COMPLETE!
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETE! ✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ profiles';
    RAISE NOTICE '  ✓ assets';
    RAISE NOTICE '  ✓ liabilities';
    RAISE NOTICE '  ✓ transactions';
    RAISE NOTICE '  ✓ net_worth_history';
    RAISE NOTICE '  ✓ savings_goals';
    RAISE NOTICE '  ✓ bills';
    RAISE NOTICE '  ✓ budgets';
    RAISE NOTICE '  ✓ insurance_policies';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Your Atlas Financial Management app is ready!';
    RAISE NOTICE '========================================';
END $$;
