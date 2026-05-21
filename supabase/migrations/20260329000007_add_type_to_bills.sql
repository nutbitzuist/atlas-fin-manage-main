-- =====================================================
-- Migration: Add 'type' to Bills for Income Automation
-- =====================================================

ALTER TABLE public.bills 
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense' CHECK (type IN ('expense', 'income'));

COMMENT ON COLUMN public.bills.type IS 'Distinguishes between recurring expenses (bills) and recurring income automation.';
