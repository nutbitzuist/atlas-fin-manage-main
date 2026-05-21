-- =====================================================
-- DEMO ACCOUNT SETUP WITH SAMPLE DATA
-- =====================================================
-- This script creates a demo account with pre-populated data
-- for showcasing the application features
--
-- Demo Account Credentials:
-- Email: demo@atlasfinance.com
-- Password: Demo123!@#
--
-- IMPORTANT: Run this script AFTER the user has been created
-- through the Supabase Auth signup flow
-- =====================================================

-- First, you need to manually create the demo user through Supabase:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" or use the signup flow
-- 3. Email: demo@atlasfinance.com
-- 4. Password: Demo123!@#
-- 5. Copy the UUID of the created user
-- 6. Replace 'YOUR_DEMO_USER_ID' below with that UUID

-- =====================================================
-- CONFIGURATION - REPLACE THIS WITH ACTUAL USER ID
-- =====================================================
DO $$
DECLARE
  demo_user_id uuid := 'YOUR_DEMO_USER_ID'; -- ⚠️ REPLACE THIS WITH ACTUAL UUID
BEGIN

-- =====================================================
-- 1. UPDATE PROFILE
-- =====================================================
UPDATE public.profiles
SET
  full_name = 'Demo User',
  default_currency = 'THB',
  timezone = 'Asia/Bangkok',
  updated_at = NOW()
WHERE id = demo_user_id;

-- =====================================================
-- 2. ASSETS (Bank accounts, investments, etc.)
-- =====================================================
INSERT INTO public.assets (user_id, name, type, value, currency, description) VALUES
(demo_user_id, 'Bangkok Bank Savings', 'Bank Account', 250000.00, 'THB', 'Main savings account'),
(demo_user_id, 'Kasikorn Bank Checking', 'Bank Account', 75000.00, 'THB', 'Day-to-day expenses account'),
(demo_user_id, 'SCB Investment Fund', 'Investment', 500000.00, 'THB', 'Mutual fund portfolio'),
(demo_user_id, 'SET50 Index Fund', 'Investment', 300000.00, 'THB', 'Stock market index fund'),
(demo_user_id, 'Condo in Sukhumvit', 'Real Estate', 5000000.00, 'THB', '1 bedroom condo'),
(demo_user_id, 'Emergency Fund', 'Cash', 150000.00, 'THB', '6 months emergency savings'),
(demo_user_id, 'Gold Savings', 'Precious Metal', 200000.00, 'THB', '2 baht of gold investment');

-- =====================================================
-- 3. LIABILITIES (Loans, credit cards, etc.)
-- =====================================================
INSERT INTO public.liabilities (user_id, name, type, amount, currency, interest_rate, description) VALUES
(demo_user_id, 'Home Loan - Bangkok Bank', 'Mortgage', 3500000.00, 'THB', 3.25, 'Condo mortgage, 20 years remaining'),
(demo_user_id, 'Car Loan - Toyota Finance', 'Auto Loan', 450000.00, 'THB', 4.50, 'Toyota Camry, 3 years remaining'),
(demo_user_id, 'Credit Card - KBank Visa', 'Credit Card', 25000.00, 'THB', 18.00, 'Primary credit card'),
(demo_user_id, 'Credit Card - SCB Platinum', 'Credit Card', 15000.00, 'THB', 18.00, 'Secondary credit card');

-- =====================================================
-- 4. TRANSACTIONS (Income and expenses)
-- =====================================================
INSERT INTO public.transactions (user_id, date, description, amount, type, category, currency) VALUES
-- Income
(demo_user_id, CURRENT_DATE - INTERVAL '5 days', 'Monthly Salary', 65000.00, 'income', 'Salary', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '35 days', 'Monthly Salary', 65000.00, 'income', 'Salary', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '12 days', 'Freelance Project', 15000.00, 'income', 'Freelance', 'THB'),

-- Food & Dining
(demo_user_id, CURRENT_DATE - INTERVAL '1 days', 'Grocery Shopping - Tops', 2500.00, 'expense', 'Food & Dining', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '2 days', 'Lunch at Paragon', 450.00, 'expense', 'Food & Dining', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '3 days', 'Dinner with Friends', 1200.00, 'expense', 'Food & Dining', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '5 days', 'Coffee - Starbucks', 180.00, 'expense', 'Food & Dining', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '8 days', 'Grocery Shopping - BigC', 3200.00, 'expense', 'Food & Dining', 'THB'),

-- Transportation
(demo_user_id, CURRENT_DATE - INTERVAL '1 days', 'BTS Skytrain Card Top-up', 500.00, 'expense', 'Transportation', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '4 days', 'Grab Ride', 250.00, 'expense', 'Transportation', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '7 days', 'Gasoline - PTT', 1800.00, 'expense', 'Transportation', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '15 days', 'Car Service & Maintenance', 3500.00, 'expense', 'Transportation', 'THB'),

-- Utilities
(demo_user_id, CURRENT_DATE - INTERVAL '10 days', 'Electricity Bill', 1850.00, 'expense', 'Utilities', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '12 days', 'Water Bill', 250.00, 'expense', 'Utilities', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '8 days', 'Internet - AIS Fibre', 599.00, 'expense', 'Utilities', 'THB'),

-- Entertainment
(demo_user_id, CURRENT_DATE - INTERVAL '6 days', 'Netflix Subscription', 419.00, 'expense', 'Entertainment', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '14 days', 'Movie Tickets - SF Cinema', 640.00, 'expense', 'Entertainment', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '20 days', 'Concert Tickets', 2500.00, 'expense', 'Entertainment', 'THB'),

-- Shopping
(demo_user_id, CURRENT_DATE - INTERVAL '9 days', 'Clothing - Central World', 3500.00, 'expense', 'Shopping', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '16 days', 'Electronics - Power Buy', 5800.00, 'expense', 'Shopping', 'THB'),

-- Healthcare
(demo_user_id, CURRENT_DATE - INTERVAL '11 days', 'Dental Checkup', 1500.00, 'expense', 'Healthcare', 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '18 days', 'Pharmacy - Medicine', 680.00, 'expense', 'Healthcare', 'THB');

-- =====================================================
-- 5. BUDGETS
-- =====================================================
INSERT INTO public.budgets (user_id, category, amount, period, currency, start_date, end_date) VALUES
(demo_user_id, 'Food & Dining', 12000.00, 'monthly', 'THB', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(demo_user_id, 'Transportation', 5000.00, 'monthly', 'THB', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(demo_user_id, 'Entertainment', 4000.00, 'monthly', 'THB', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(demo_user_id, 'Shopping', 8000.00, 'monthly', 'THB', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(demo_user_id, 'Healthcare', 3000.00, 'monthly', 'THB', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'),
(demo_user_id, 'Utilities', 3000.00, 'monthly', 'THB', DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');

-- =====================================================
-- 6. BILLS & SUBSCRIPTIONS
-- =====================================================
INSERT INTO public.bills (user_id, name, amount, currency, due_date, category, is_recurring, recurrence_period, is_paid, description) VALUES
(demo_user_id, 'Condo Management Fee', 2500.00, 'THB', CURRENT_DATE + INTERVAL '5 days', 'Housing', true, 'monthly', false, 'Monthly condo common area fee'),
(demo_user_id, 'AIS Fibre Internet', 599.00, 'THB', CURRENT_DATE + INTERVAL '12 days', 'Utilities', true, 'monthly', false, '1Gbps fiber internet'),
(demo_user_id, 'Netflix Premium', 419.00, 'THB', CURRENT_DATE + INTERVAL '8 days', 'Entertainment', true, 'monthly', false, '4K streaming plan'),
(demo_user_id, 'Spotify Family', 179.00, 'THB', CURRENT_DATE + INTERVAL '15 days', 'Entertainment', true, 'monthly', false, 'Music streaming'),
(demo_user_id, 'True Mobile Phone', 699.00, 'THB', CURRENT_DATE + INTERVAL '20 days', 'Utilities', true, 'monthly', false, 'Unlimited data plan'),
(demo_user_id, 'YouTube Premium', 159.00, 'THB', CURRENT_DATE + INTERVAL '18 days', 'Entertainment', true, 'monthly', false, 'Ad-free YouTube'),
(demo_user_id, 'Car Insurance Premium', 18500.00, 'THB', CURRENT_DATE + INTERVAL '60 days', 'Insurance', true, 'yearly', false, 'Annual car insurance'),
(demo_user_id, 'Gym Membership - Fitness First', 2500.00, 'THB', CURRENT_DATE + INTERVAL '10 days', 'Health', true, 'monthly', false, 'Premium gym membership');

-- =====================================================
-- 7. SAVINGS GOALS
-- =====================================================
INSERT INTO public.savings_goals (user_id, name, target_amount, current_amount, currency, target_date, category, description) VALUES
(demo_user_id, 'Emergency Fund', 360000.00, 150000.00, 'THB', CURRENT_DATE + INTERVAL '18 months', 'Emergency', '6 months of expenses for financial security'),
(demo_user_id, 'Japan Vacation 2026', 120000.00, 35000.00, 'THB', '2026-06-01', 'Travel', 'Two-week trip to Tokyo and Osaka'),
(demo_user_id, 'New MacBook Pro', 85000.00, 42000.00, 'THB', CURRENT_DATE + INTERVAL '6 months', 'Electronics', 'Upgrade to M3 MacBook Pro for work'),
(demo_user_id, 'Down Payment for Car', 200000.00, 75000.00, 'THB', CURRENT_DATE + INTERVAL '24 months', 'Car', 'Save for new EV down payment'),
(demo_user_id, 'Retirement Fund', 5000000.00, 800000.00, 'THB', '2045-12-31', 'Retirement', 'Long-term retirement savings'),
(demo_user_id, 'Wedding Fund', 300000.00, 120000.00, 'THB', CURRENT_DATE + INTERVAL '12 months', 'Wedding', 'Save for dream wedding ceremony');

-- =====================================================
-- 8. INSURANCE POLICIES
-- =====================================================
INSERT INTO public.insurance_policies (
  user_id, policy_name, policy_type, provider, policy_number,
  premium_amount, premium_frequency, currency, coverage_amount,
  start_date, end_date, renewal_date, beneficiaries, notes
) VALUES
(demo_user_id, 'AIA Life Protect Plus', 'life', 'AIA Thailand', 'AIA-2023-L-789456',
 15000.00, 'yearly', 'THB', 3000000.00,
 '2023-03-15', NULL, '2025-03-15', 'Spouse: Jane Doe, Parents: John & Mary Doe',
 'Life insurance with critical illness rider'),

(demo_user_id, 'Allianz Health Shield', 'health', 'Allianz Ayudhya', 'ALZ-H-2024-123789',
 8500.00, 'yearly', 'THB', 1000000.00,
 '2024-01-10', NULL, '2025-01-10', NULL,
 'Comprehensive health coverage with international network'),

(demo_user_id, 'Bangkok Insurance Type 1', 'vehicle', 'Bangkok Insurance', 'BKI-V-2024-456123',
 18500.00, 'yearly', 'THB', 800000.00,
 '2024-06-01', NULL, '2025-06-01', NULL,
 'Full coverage for Toyota Camry 2020'),

(demo_user_id, 'Muang Thai Fire Insurance', 'property', 'Muang Thai Insurance', 'MTI-P-2023-987654',
 4500.00, 'yearly', 'THB', 5000000.00,
 '2023-09-20', NULL, '2025-09-20', NULL,
 'Condo fire and theft protection'),

(demo_user_id, 'AXA Critical Illness', 'critical', 'AXA Thailand', 'AXA-CI-2024-741852',
 6800.00, 'yearly', 'THB', 1500000.00,
 '2024-02-14', NULL, '2025-02-14', 'Spouse: Jane Doe',
 'Covers 36 critical illnesses including cancer, heart attack, stroke');

-- =====================================================
-- 9. NET WORTH HISTORY (Last 6 months)
-- =====================================================
INSERT INTO public.net_worth_history (user_id, date, total_assets, total_liabilities, net_worth, currency) VALUES
(demo_user_id, CURRENT_DATE - INTERVAL '6 months', 6200000.00, 4100000.00, 2100000.00, 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '5 months', 6280000.00, 4050000.00, 2230000.00, 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '4 months', 6350000.00, 4000000.00, 2350000.00, 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '3 months', 6420000.00, 3950000.00, 2470000.00, 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '2 months', 6450000.00, 3920000.00, 2530000.00, 'THB'),
(demo_user_id, CURRENT_DATE - INTERVAL '1 month', 6475000.00, 3990000.00, 2485000.00, 'THB'),
(demo_user_id, CURRENT_DATE, 6475000.00, 3990000.00, 2485000.00, 'THB');

RAISE NOTICE 'Demo account data successfully populated for user ID: %', demo_user_id;
RAISE NOTICE 'Summary:';
RAISE NOTICE '  - 7 Assets created';
RAISE NOTICE '  - 4 Liabilities created';
RAISE NOTICE '  - 22 Transactions created';
RAISE NOTICE '  - 6 Budgets created';
RAISE NOTICE '  - 8 Bills/Subscriptions created';
RAISE NOTICE '  - 6 Savings Goals created';
RAISE NOTICE '  - 5 Insurance Policies created';
RAISE NOTICE '  - 7 Net Worth History entries created';

END $$;
