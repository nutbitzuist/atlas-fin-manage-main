-- =====================================================
-- Migration: Augment Bills with Automation Features
-- =====================================================
-- Adds 'auto_pay' and 'account_id' to enable automatic
-- monthly materialization of bills as expenses.

ALTER TABLE public.bills 
  ADD COLUMN IF NOT EXISTS auto_pay BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_auto_processed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.bills.auto_pay IS 'If true, the bill will be automatically marked as paid and recorded as an expense transaction on its due date.';
COMMENT ON COLUMN public.bills.account_id IS 'The default account to use for automatic or manual payment processing of this bill.';
