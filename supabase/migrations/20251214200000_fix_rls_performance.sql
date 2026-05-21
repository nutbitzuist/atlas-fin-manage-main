-- Fix auth_rls_initplan performance warnings
-- Replace auth.uid() with (select auth.uid()) for better query performance
-- This makes the auth function evaluate once per query instead of once per row

-- ============================================================================
-- ASSETS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can update own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON public.assets;

CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- LIABILITIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can insert own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can update own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can delete own liabilities" ON public.liabilities;

CREATE POLICY "Users can view own liabilities" ON public.liabilities
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own liabilities" ON public.liabilities
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own liabilities" ON public.liabilities
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own liabilities" ON public.liabilities
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- CASH_ACCOUNTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can insert own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can update own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can delete own cash accounts" ON public.cash_accounts;

CREATE POLICY "Users can view own cash accounts" ON public.cash_accounts
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own cash accounts" ON public.cash_accounts
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own cash accounts" ON public.cash_accounts
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own cash accounts" ON public.cash_accounts
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- NET_WORTH_HISTORY TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own net worth history" ON public.net_worth_history;
DROP POLICY IF EXISTS "Users can insert own net worth history" ON public.net_worth_history;

CREATE POLICY "Users can view own net worth history" ON public.net_worth_history
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own net worth history" ON public.net_worth_history
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- INVESTMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments;

CREATE POLICY "Users can view own investments" ON public.investments
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own investments" ON public.investments
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own investments" ON public.investments
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own investments" ON public.investments
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- MT_ACCOUNT_HISTORY TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own MT history" ON public.mt_account_history;
DROP POLICY IF EXISTS "Users can insert their own MT history" ON public.mt_account_history;

CREATE POLICY "Users can view their own MT history" ON public.mt_account_history
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own MT history" ON public.mt_account_history
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- MT_POSITIONS TABLE (also fixes multiple_permissive_policies)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own MT positions" ON public.mt_positions;
DROP POLICY IF EXISTS "Users can manage their own MT positions" ON public.mt_positions;

-- Consolidate into single policies per action to fix multiple_permissive_policies warning
CREATE POLICY "Users can view their own MT positions" ON public.mt_positions
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own MT positions" ON public.mt_positions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own MT positions" ON public.mt_positions
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own MT positions" ON public.mt_positions
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- REAL_ESTATE TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own real estate" ON public.real_estate;
DROP POLICY IF EXISTS "Users can insert own real estate" ON public.real_estate;
DROP POLICY IF EXISTS "Users can update own real estate" ON public.real_estate;
DROP POLICY IF EXISTS "Users can delete own real estate" ON public.real_estate;

CREATE POLICY "Users can view own real estate" ON public.real_estate
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own real estate" ON public.real_estate
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own real estate" ON public.real_estate
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own real estate" ON public.real_estate
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;

CREATE POLICY "Users can view own vehicles" ON public.vehicles
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own vehicles" ON public.vehicles
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own vehicles" ON public.vehicles
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- OTHER_ASSETS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own other assets" ON public.other_assets;
DROP POLICY IF EXISTS "Users can insert own other assets" ON public.other_assets;
DROP POLICY IF EXISTS "Users can update own other assets" ON public.other_assets;
DROP POLICY IF EXISTS "Users can delete own other assets" ON public.other_assets;

CREATE POLICY "Users can view own other assets" ON public.other_assets
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own other assets" ON public.other_assets
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own other assets" ON public.other_assets
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own other assets" ON public.other_assets
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- CREDIT_CARDS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can insert their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON public.credit_cards;

CREATE POLICY "Users can view their own credit cards" ON public.credit_cards
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own credit cards" ON public.credit_cards
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own credit cards" ON public.credit_cards
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own credit cards" ON public.credit_cards
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- LOANS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can insert their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update their own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete their own loans" ON public.loans;

CREATE POLICY "Users can view their own loans" ON public.loans
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own loans" ON public.loans
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own loans" ON public.loans
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own loans" ON public.loans
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- SAVINGS_GOALS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON public.savings_goals;

CREATE POLICY "Users can view own savings goals" ON public.savings_goals
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own savings goals" ON public.savings_goals
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own savings goals" ON public.savings_goals
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own savings goals" ON public.savings_goals
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- BILLS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can insert own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can update own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can delete own bills" ON public.bills;

CREATE POLICY "Users can view own bills" ON public.bills
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own bills" ON public.bills
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own bills" ON public.bills
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own bills" ON public.bills
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- INSURANCE_POLICIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can insert their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can update their own insurance policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Users can delete their own insurance policies" ON public.insurance_policies;

CREATE POLICY "Users can view their own insurance policies" ON public.insurance_policies
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own insurance policies" ON public.insurance_policies
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own insurance policies" ON public.insurance_policies
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own insurance policies" ON public.insurance_policies
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- NET_WORTH_GOALS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own net worth goals" ON public.net_worth_goals;
DROP POLICY IF EXISTS "Users can insert their own net worth goals" ON public.net_worth_goals;
DROP POLICY IF EXISTS "Users can update their own net worth goals" ON public.net_worth_goals;
DROP POLICY IF EXISTS "Users can delete their own net worth goals" ON public.net_worth_goals;

CREATE POLICY "Users can view their own net worth goals" ON public.net_worth_goals
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own net worth goals" ON public.net_worth_goals
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own net worth goals" ON public.net_worth_goals
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own net worth goals" ON public.net_worth_goals
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- FINANCIAL_HEALTH_HISTORY TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own financial health history" ON public.financial_health_history;
DROP POLICY IF EXISTS "Users can insert their own financial health history" ON public.financial_health_history;
DROP POLICY IF EXISTS "Users can update their own financial health history" ON public.financial_health_history;
DROP POLICY IF EXISTS "Users can delete their own financial health history" ON public.financial_health_history;

CREATE POLICY "Users can view their own financial health history" ON public.financial_health_history
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own financial health history" ON public.financial_health_history
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own financial health history" ON public.financial_health_history
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own financial health history" ON public.financial_health_history
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- TAX_PLANNING TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own tax planning data" ON public.tax_planning;
DROP POLICY IF EXISTS "Users can insert their own tax planning data" ON public.tax_planning;
DROP POLICY IF EXISTS "Users can update their own tax planning data" ON public.tax_planning;
DROP POLICY IF EXISTS "Users can delete their own tax planning data" ON public.tax_planning;

CREATE POLICY "Users can view their own tax planning data" ON public.tax_planning
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own tax planning data" ON public.tax_planning
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own tax planning data" ON public.tax_planning
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own tax planning data" ON public.tax_planning
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- API_KEYS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;

CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can create their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PORTFOLIO_STATUS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own portfolio status" ON public.portfolio_status;

CREATE POLICY "Users can view their own portfolio status" ON public.portfolio_status
  FOR SELECT USING (user_id = (select auth.uid()));

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = (select auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = (select auth.uid()));
