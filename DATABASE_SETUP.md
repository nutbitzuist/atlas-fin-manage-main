# Database Setup for New Dashboard Features

## Overview
The new dashboard features require additional database tables. Follow these steps to set up your Supabase database.

## Required Tables
The following tables need to be created in your Supabase database:
1. `bills` - For tracking upcoming bills and subscriptions
2. `savings_goals` - For tracking savings goals
3. `emergency_fund_target` column in `profiles` table

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/migrations/20251109100000_add_savings_goals_and_bills.sql`
5. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

## Migration File Location
The migration file is located at:
```
supabase/migrations/20251109100000_add_savings_goals_and_bills.sql
```

## What This Migration Does

### 1. Creates `savings_goals` table
- Stores user savings goals with current and target amounts
- Tracks progress toward financial goals
- Optional target date and category

### 2. Creates `bills` table
- Tracks upcoming bills and subscriptions
- Supports one-time and recurring bills
- Marks bills as paid/unpaid
- Filters bills by due date

### 3. Adds `emergency_fund_target` to `profiles`
- Stores user's emergency fund goal
- Used to calculate emergency fund progress

## Row Level Security (RLS)
All tables have RLS policies enabled to ensure users can only access their own data.

## Verifying the Setup

After running the migration, you should see:
1. The 4 Quick Stats Widgets working:
   - Emergency Fund Status
   - Credit Card Utilization
   - Upcoming Bills (next 7 days)
   - Savings Goals Progress

2. Data can be added through the dashboard:
   - Use "Add Expense" / "Add Income" buttons
   - Use "Add Account" to add assets

## Troubleshooting

If the widgets show "No data":
1. Check browser console for errors (F12)
2. Verify tables exist in Supabase dashboard
3. Check that RLS policies are enabled
4. Try adding test data manually in Supabase dashboard

## Adding Test Data

You can add test data through the Supabase dashboard:

### Test Bill:
```sql
INSERT INTO bills (user_id, name, amount, due_date, category, currency)
VALUES (auth.uid(), 'Test Bill', 100, CURRENT_DATE + interval '3 days', 'Utilities', 'THB');
```

### Test Savings Goal:
```sql
INSERT INTO savings_goals (user_id, name, current_amount, target_amount, currency)
VALUES (auth.uid(), 'Emergency Fund', 5000, 15000, 'THB');
```

### Set Emergency Fund Target:
```sql
UPDATE profiles
SET emergency_fund_target = 15000
WHERE id = auth.uid();
```

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Supabase connection in `src/integrations/supabase/client.ts`
3. Ensure you're logged in to the application
