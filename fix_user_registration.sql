-- Fix user registration issues
-- Run this in Supabase SQL Editor

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to handle cases where profile might already exist
  INSERT INTO public.profiles (id, full_name, default_currency, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'THB',
    'Asia/Bangkok'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Make sure RLS policies are correct
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Recreate policies with better coverage
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add a policy for service role to insert profiles (for the trigger)
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure categories table structure exists (needed by default category seeding)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text NOT NULL DEFAULT '💰',
  color text NOT NULL DEFAULT '#3b82f6',
  is_default boolean NOT NULL DEFAULT false,
  transaction_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- Maintain updated_at timestamp for categories
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ SECURITY DEFINER;

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_categories_updated_at();

-- Seed helper to populate default categories for each user
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
$$;

-- Hook to seed categories for new users
CREATE OR REPLACE FUNCTION public.create_categories_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_default_categories_for_user(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_categories_for_new_user();
