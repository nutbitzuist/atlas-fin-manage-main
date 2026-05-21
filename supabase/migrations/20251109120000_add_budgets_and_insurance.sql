-- Create budgets table
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

-- Enable Row Level Security for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for budgets
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

-- Create insurance_policies table
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

-- Enable Row Level Security for insurance_policies
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

-- Create policies for insurance_policies
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

-- Create indexes for better query performance
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_month ON public.budgets(month);
CREATE INDEX idx_insurance_policies_user_id ON public.insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_renewal_date ON public.insurance_policies(renewal_date);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
