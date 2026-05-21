# 🔄 Switch to New Supabase Database

Complete guide to setting up a fresh Supabase database for Atlas Financial Management.

---

## 📋 Quick Steps Overview

1. **Create new Supabase project** (5 minutes)
2. **Update local configuration** (2 minutes)
3. **Run database setup script** (1 minute)
4. **Test the connection** (2 minutes)

**Total Time: ~10 minutes**

---

## Step 1: Create New Supabase Project

### 1.1 Go to Supabase Dashboard

Visit: **https://supabase.com/dashboard**

### 1.2 Create New Project

1. Click **"New Project"** button
2. Fill in the details:
   - **Name**: `atlas-fin-manage` (or your preferred name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
     - 🌏 Asia: Singapore / Tokyo / Mumbai
     - 🌎 Americas: US East / US West
     - 🌍 Europe: Frankfurt / London
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for setup to complete

---

## Step 2: Get Your Credentials

### 2.1 Navigate to API Settings

Once your project is ready:

1. Click **"Settings"** in the left sidebar
2. Click **"API"**

### 2.2 Copy These Values

You'll need **3 things**:

1. **Project URL**
   - Example: `https://abcdefgh.supabase.co`

2. **Project ID** (the part before .supabase.co)
   - Example: `abcdefgh`

3. **anon public key** (under "Project API keys")
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)

📋 **Keep these handy - you'll use them in the next step!**

---

## Step 3: Update Local Configuration

### 3.1 Update .env File

Open `.env` in your project root and replace with your new values:

```bash
VITE_SUPABASE_PROJECT_ID="YOUR_NEW_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_ANON_KEY"
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
```

**Example:**
```bash
VITE_SUPABASE_PROJECT_ID="abcdefgh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://abcdefgh.supabase.co"
```

### 3.2 Update supabase/config.toml

Open `supabase/config.toml` and update:

```toml
project_id = "YOUR_NEW_PROJECT_ID"
```

**Example:**
```toml
project_id = "abcdefgh"
```

### 3.3 Save Both Files

Make sure to save both files!

---

## Step 4: Set Up Database Tables

### 4.1 Open SQL Editor

Go to your new project's SQL Editor:

**URL Format:**
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
```

**Or manually:**
1. Go to your Supabase Dashboard
2. Select your new project
3. Click **"SQL Editor"** in the sidebar
4. Click **"New query"**

### 4.2 Run Setup Script

1. Open the file **`SETUP_NEW_DATABASE.sql`** in this directory
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
3. Paste into the SQL Editor
4. Click **"RUN"** (or press Ctrl/Cmd + Enter)

### 4.3 Verify Success

You should see output like:

```
✅ DATABASE SETUP COMPLETE!
Tables created:
  ✓ profiles
  ✓ assets
  ✓ liabilities
  ✓ transactions
  ✓ net_worth_history
  ✓ savings_goals
  ✓ bills
  ✓ budgets
  ✓ insurance_policies
Your Atlas Financial Management app is ready!
```

If you see any errors, check:
- Did you copy the entire script?
- Are you in the correct project?

---

## Step 5: Test the Connection

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Each Feature

Open your app and try:

1. **Sign up** with a new account (or sign in if you have an existing one)
2. **Bills**: Add a new bill
3. **Savings Goals**: Create a savings goal
4. **Budget**: Set a budget category
5. **Insurance**: Add an insurance policy

All should work without errors!

### 5.3 Check Browser Console

Press **F12** to open Developer Tools and check the Console tab.

✅ **No errors = Success!**
❌ **Errors? Check these:**
- Is `.env` file updated correctly?
- Did you run the database setup script?
- Are you logged in with a valid account?

---

## Step 6: Enable Google OAuth (Optional)

If you want to use Google sign-in:

### 6.1 Configure Google OAuth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Add your Google OAuth credentials:
   - **Client ID**: Your Google Cloud OAuth Client ID
   - **Client Secret**: Your Google Cloud OAuth Client Secret
4. Add authorized redirect URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```

### 6.2 Get Google OAuth Credentials

If you don't have them yet:

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID**
5. Add authorized redirect URIs:
   - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth` (for local testing)

---

## Step 7: Update Git (Optional)

If you want to commit the configuration changes:

```bash
# Stage the changes
git add .env supabase/config.toml

# Commit
git commit -m "Update Supabase configuration to new project"

# Push
git push
```

**⚠️ Security Note:** Make sure `.env` is in your `.gitignore` file!

---

## 🎉 You're Done!

Your app is now connected to a fresh Supabase database with:

- ✅ All tables created
- ✅ Row Level Security enabled
- ✅ Proper indexes for performance
- ✅ Automatic triggers for timestamps
- ✅ User authentication ready

---

## 🆘 Troubleshooting

### Issue: "Failed to fetch" errors

**Solution:** Check your `.env` file:
- Is the URL correct?
- Is the anon key correct?
- Did you restart your dev server after changing `.env`?

### Issue: "relation does not exist"

**Solution:** Run the database setup script again:
1. Go to SQL Editor
2. Copy all contents from `SETUP_NEW_DATABASE.sql`
3. Run it

### Issue: "User not authenticated"

**Solution:**
1. Sign out
2. Clear browser cookies for localhost:5173
3. Sign in again

### Issue: Google OAuth not working

**Solution:**
1. Check your Google OAuth credentials in Supabase
2. Verify redirect URLs match exactly
3. Make sure OAuth is enabled in Supabase settings

---

## 📞 Need More Help?

- Check browser console for specific error messages (F12)
- Check Supabase logs: Dashboard → Logs
- Verify table structure: Dashboard → Table Editor

---

## 🔙 Rollback (If Needed)

Want to go back to your old database?

Just restore these values in `.env`:

```bash
VITE_SUPABASE_PROJECT_ID="lrtxmwoutolirirljcsb"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydHhtd291dG9saXJpcmxqY3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDIxOTEsImV4cCI6MjA3ODIxODE5MX0.57SdUFzRZ4hXucuA8_Qpcn1zELvUCPkYefM6IEr7zp0"
VITE_SUPABASE_URL="https://lrtxmwoutolirirljcsb.supabase.co"
```

And restart your dev server.
