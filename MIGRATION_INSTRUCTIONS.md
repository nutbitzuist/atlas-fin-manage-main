# 🗄️ Database Migration Instructions

## Quick Start - Apply Migrations

### Step 1: Access Supabase SQL Editor

Click this link to go directly to your SQL Editor:
**https://supabase.com/dashboard/project/lrtxmwoutolirirljcsb/sql/new**

Or manually navigate:
1. Go to https://supabase.com
2. Select your project: `lrtxmwoutolirirljcsb`
3. Click **SQL Editor** in the sidebar
4. Click **New Query**

### Step 2: Run the Migration Script

1. Open the file: `APPLY_MIGRATIONS.sql` (created in this directory)
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click **RUN** (or press Ctrl/Cmd + Enter)

### Step 3: Check the Results

You should see output like:
```
✓ bills table created successfully
✓ savings_goals table created successfully
✓ budgets table created successfully
✓ insurance_policies table created successfully
ALL TABLES CREATED SUCCESSFULLY! ✅
```

---

## What This Migration Creates

### 📊 Tables Created

1. **`savings_goals`** - Track your savings targets
   - Fields: name, target_amount, current_amount, target_date, category, description

2. **`bills`** - Manage bills and subscriptions
   - Fields: name, amount, due_date, is_recurring, recurrence_period, is_paid

3. **`budgets`** - Monthly budget tracking by category
   - Fields: category, monthly_limit, month, description

4. **`insurance_policies`** - Insurance policy management
   - Fields: policy_name, policy_type, provider, premium_amount, coverage_amount, renewal_date

### 🔒 Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Policies automatically filter by user_id

### ⚡ Performance

- Indexes created on frequently queried columns
- Automatic `updated_at` triggers on all tables

---

## Verification

### Quick Check

Run this query in SQL Editor to verify:

```sql
SELECT
    tablename,
    CASE
        WHEN tablename IN ('bills', 'savings_goals', 'budgets', 'insurance_policies')
        THEN '✅ Ready'
        ELSE '❓ Unknown'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('bills', 'savings_goals', 'budgets', 'insurance_policies')
ORDER BY tablename;
```

Expected result: All 4 tables with "✅ Ready" status

### Detailed Verification

Check table structures:

```sql
-- Check bills table
SELECT * FROM information_schema.columns
WHERE table_name = 'bills'
ORDER BY ordinal_position;

-- Check savings_goals table
SELECT * FROM information_schema.columns
WHERE table_name = 'savings_goals'
ORDER BY ordinal_position;

-- Check budgets table
SELECT * FROM information_schema.columns
WHERE table_name = 'budgets'
ORDER BY ordinal_position;

-- Check insurance_policies table
SELECT * FROM information_schema.columns
WHERE table_name = 'insurance_policies'
ORDER BY ordinal_position;
```

---

## Testing Your Application

After applying migrations:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test each feature:**
   - ✅ Bills & Subscriptions - Add, view, delete bills
   - ✅ Savings Goals - Create goals, add contributions
   - ✅ Budget - Set budgets, track spending
   - ✅ Insurance - Add policies, track renewals

3. **Check browser console** for any errors

---

## Troubleshooting

### Issue: "relation already exists"
**Solution:** The table already exists. This is fine - the script uses `CREATE TABLE IF NOT EXISTS`.

### Issue: "permission denied"
**Solution:** Make sure you're logged in to the correct Supabase project and have admin access.

### Issue: "foreign key constraint"
**Solution:** Make sure the base tables (auth.users, profiles, transactions) exist first.

### Issue: Features still showing mock data
**Solution:**
1. Clear browser cache and reload
2. Check browser console for error messages
3. Verify you're logged in with a valid user account
4. Run the verification queries above

---

## Need Help?

If you encounter any issues:

1. Check the Messages/Notices in the SQL Editor output
2. Look for error messages in your browser console (F12)
3. Verify your Supabase project ID matches: `lrtxmwoutolirirljcsb`

---

## What's Next?

Once migrations are applied successfully:

1. ✅ All features will work with real database
2. ✅ Data persists between sessions
3. ✅ Multiple users can use the app with isolated data
4. ✅ Ready for production use

Your financial management app is now fully functional! 🎉
