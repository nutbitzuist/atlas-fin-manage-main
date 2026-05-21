-- Enhance transactions table with additional fields for income and expense tracking
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS merchant TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id) WHERE account_id IS NOT NULL;
