-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
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

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for credit_cards
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_status ON credit_cards(status);

-- Create indexes for loans
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_type ON loans(loan_type);
CREATE INDEX idx_loans_status ON loans(status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credit_cards
CREATE POLICY "Users can view their own credit cards"
  ON credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit cards"
  ON credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit cards"
  ON credit_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit cards"
  ON credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for loans
CREATE POLICY "Users can view their own loans"
  ON loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
  ON loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
  ON loans FOR DELETE
  USING (auth.uid() = user_id);
