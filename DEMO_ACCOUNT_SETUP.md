# Demo Account Setup Guide

This guide will help you set up a demo account with pre-populated data so people can explore your Atlas Finance Management application.

## 📋 Overview

The demo account includes realistic sample data across all features:
- **7 Assets** (bank accounts, investments, real estate, gold)
- **4 Liabilities** (home loan, car loan, credit cards)
- **22 Transactions** (income and various expense categories)
- **6 Budget Categories** with spending limits
- **8 Bills & Subscriptions** (recurring payments)
- **6 Savings Goals** (emergency fund, vacation, retirement, etc.)
- **5 Insurance Policies** (life, health, vehicle, property, critical illness)
- **7 Net Worth History** entries (last 6 months trend)

---

## 🔧 Setup Instructions

### Step 1: Create the Demo User Account

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** (or "Invite user")
4. Fill in the details:
   - **Email**: `demo@atlasfinance.com`
   - **Password**: `Demo123!@#`
   - **Confirm Password**: `Demo123!@#`
   - **Auto Confirm User**: ✅ Check this box
5. Click **"Create user"** or **"Send invitation"**
6. **Copy the User ID (UUID)** - you'll need this for Step 2

**Option B: Using the Application Signup**

1. Go to your application's signup page
2. Sign up with:
   - **Email**: `demo@atlasfinance.com`
   - **Password**: `Demo123!@#`
   - **Full Name**: `Demo User`
3. Verify the email if required
4. Go to Supabase Dashboard → Authentication → Users
5. Find the demo user and **copy the User ID (UUID)**

---

### Step 2: Populate Demo Data

1. **Open the SQL script**:
   - File: `supabase/migrations/demo_account_data.sql`

2. **Edit the script to add the User ID**:
   - Find line 27: `demo_user_id uuid := 'YOUR_DEMO_USER_ID';`
   - Replace `'YOUR_DEMO_USER_ID'` with the UUID you copied in Step 1
   - Example: `demo_user_id uuid := '123e4567-e89b-12d3-a456-426614174000';`

3. **Run the SQL script in Supabase**:
   - Go to Supabase Dashboard → **SQL Editor**
   - Click **"New query"**
   - Copy and paste the entire contents of `demo_account_data.sql`
   - Click **"Run"** or press `Ctrl/Cmd + Enter`

4. **Verify success**:
   - You should see success messages in the output panel:
     ```
     NOTICE: Demo account data successfully populated for user ID: [uuid]
     NOTICE: Summary:
     NOTICE:   - 7 Assets created
     NOTICE:   - 4 Liabilities created
     NOTICE:   - 22 Transactions created
     NOTICE:   - 6 Budgets created
     NOTICE:   - 8 Bills/Subscriptions created
     NOTICE:   - 6 Savings Goals created
     NOTICE:   - 5 Insurance Policies created
     NOTICE:   - 7 Net Worth History entries created
     ```

---

### Step 3: Test the Demo Account

1. **Log out** of any current account
2. **Log in** with demo credentials:
   - Email: `demo@atlasfinance.com`
   - Password: `Demo123!@#`
3. **Explore the dashboard** - you should see:
   - Net worth chart with 6 months of history
   - Recent transactions
   - Budget vs. actual spending
   - Upcoming bills
   - Savings goals progress
   - Insurance policies

---

## 📊 Demo Data Details

### Assets (Total: ฿6,475,000)
- Bangkok Bank Savings: ฿250,000
- Kasikorn Bank Checking: ฿75,000
- SCB Investment Fund: ฿500,000
- SET50 Index Fund: ฿300,000
- Condo in Sukhumvit: ฿5,000,000
- Emergency Fund: ฿150,000
- Gold Savings: ฿200,000

### Liabilities (Total: ฿3,990,000)
- Home Loan: ฿3,500,000 (3.25% interest)
- Car Loan: ฿450,000 (4.50% interest)
- KBank Visa Credit Card: ฿25,000
- SCB Platinum Credit Card: ฿15,000

### Net Worth: ฿2,485,000

### Monthly Recurring Bills (Total: ฿7,554/month)
- Condo Management Fee: ฿2,500
- Internet: ฿599
- Mobile Phone: ฿699
- Netflix: ฿419
- Spotify: ฿179
- YouTube Premium: ฿159
- Gym Membership: ฿2,500

### Savings Goals
- Emergency Fund: ฿150,000 / ฿360,000 (42%)
- Japan Vacation: ฿35,000 / ฿120,000 (29%)
- MacBook Pro: ฿42,000 / ฿85,000 (49%)
- Car Down Payment: ฿75,000 / ฿200,000 (38%)
- Retirement: ฿800,000 / ฿5,000,000 (16%)
- Wedding: ฿120,000 / ฿300,000 (40%)

### Insurance Coverage (Total: ฿11,300,000)
- Life Insurance: ฿3,000,000
- Health Insurance: ฿1,000,000
- Vehicle Insurance: ฿800,000
- Property Insurance: ฿5,000,000
- Critical Illness: ฿1,500,000

---

## 🔒 Security Notes

1. **Change the password** if deploying to production:
   - The default password `Demo123!@#` is for demonstration only
   - Consider using a stronger password for public demos

2. **Demo account limitations**:
   - This account should be **read-only** in production environments
   - Consider adding a banner: "This is a demo account with sample data"
   - Reset demo data periodically if users can modify it

3. **RLS Protection**:
   - Row-Level Security (RLS) ensures demo users can only see their own data
   - Other users cannot access or modify demo account data

---

## 🔄 Resetting Demo Data

To reset the demo account data to its original state:

1. **Delete existing data**:
   ```sql
   -- Run this in Supabase SQL Editor
   DELETE FROM public.net_worth_history WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.insurance_policies WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.savings_goals WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.bills WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.budgets WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.transactions WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.liabilities WHERE user_id = 'YOUR_DEMO_USER_ID';
   DELETE FROM public.assets WHERE user_id = 'YOUR_DEMO_USER_ID';
   ```

2. **Re-run the setup script**:
   - Follow Step 2 again to repopulate the data

---

## 🎨 Customizing Demo Data

To customize the demo data for your needs:

1. Edit `supabase/migrations/demo_account_data.sql`
2. Modify values, add/remove entries, or change categories
3. Re-run the script to apply changes
4. Test the changes by logging into the demo account

---

## 📝 Displaying Demo Account Info

Consider adding a banner or notice to your app when users log in with the demo account:

```tsx
// Example implementation
{session?.user.email === 'demo@atlasfinance.com' && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <p className="text-blue-800 font-medium">
      📊 You're viewing a demo account with sample data
    </p>
    <p className="text-blue-600 text-sm mt-1">
      All data shown is fictional. Sign up to create your own account!
    </p>
  </div>
)}
```

---

## ✅ Verification Checklist

After setup, verify these features work correctly:

- [ ] Dashboard shows net worth chart with historical data
- [ ] Assets and liabilities display correctly
- [ ] Transactions appear in the transaction list
- [ ] Budget page shows spending vs. limits
- [ ] Bills page displays upcoming recurring payments
- [ ] Savings goals show progress bars
- [ ] Insurance page lists all policies
- [ ] All charts and visualizations render properly
- [ ] Demo user can navigate all pages without errors

---

## 🚀 Next Steps

1. **Document the demo credentials** on your website/landing page
2. **Add a demo login button** for quick access
3. **Reset demo data regularly** (weekly/monthly) to keep it clean
4. **Monitor demo account usage** to understand which features users explore most

---

## 📞 Support

If you encounter issues during setup:
1. Check Supabase logs for error messages
2. Verify RLS policies are enabled on all tables
3. Ensure the demo user ID is correct
4. Check that all migrations have been applied

Happy demoing! 🎉
