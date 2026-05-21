-- =====================================================
-- CATEGORIES TABLE
-- Stores user-defined income and expense categories
-- =====================================================
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

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- =====================================================
-- SEED DEFAULT CATEGORIES
-- Insert default categories for all existing users
-- =====================================================

-- Helper function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories_for_user(p_user_id UUID)
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

-- Create default categories for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM create_default_categories_for_user(user_record.id);
  END LOOP;
END $$;

-- =====================================================
-- TRIGGER: Auto-create categories for new users
-- =====================================================
CREATE OR REPLACE FUNCTION create_categories_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_categories_for_new_user();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.categories IS 'User-defined income and expense categories with customizable icons and colors';
COMMENT ON COLUMN public.categories.is_default IS 'Whether this is a system-provided default category';
COMMENT ON COLUMN public.categories.transaction_count IS 'Number of transactions using this category (updated by triggers)';
