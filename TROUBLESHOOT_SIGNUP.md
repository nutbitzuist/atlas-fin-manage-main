# Troubleshooting Signup Issues - Step by Step

## Current Issue
New users cannot sign up with either email or Google OAuth. Error: "Database order saving new user"

---

## Step 1: Verify Database Setup

### 1.1 Run the Debug Script

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/sql/new

2. Copy the entire contents of `DEBUG_DATABASE_SETUP.sql`

3. Paste and run it

4. **Check the output**:
   - If you see `✗ profiles table MISSING` → **Go to Step 2**
   - If you see `✓ All components are in place!` → **Go to Step 3**

---

## Step 2: Apply Database Migration (If Missing Components)

This is the most likely cause of your issue.

### 2.1 Apply the Complete Database Setup

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/sql/new

2. Open `DATABASE_COMPLETE_SETUP.sql` from your project

3. **Copy ALL contents** (it's 1,400+ lines)

4. Paste into Supabase SQL Editor

5. Click **"Run"** (or Cmd+Enter / Ctrl+Enter)

6. Wait 5-10 seconds for execution

7. **Verify the output shows**:
   ```
   ✓ 25 tables created
   ✓ 8 functions created
   ✓ 15 triggers created
   ```

8. **Re-run the debug script** from Step 1.1 to confirm everything is now present

9. **Try signing up again** - it should work now!

---

## Step 3: Check Supabase Auth Logs (If Components Are Present)

If the database components exist but signup still fails:

### 3.1 Check Auth Logs

1. Go to Supabase Logs: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/logs/explorer

2. Click on "Auth" logs

3. Try to sign up again (either with email or Google)

4. Look for the error in the logs

5. **Copy the error message** and proceed to Step 3.2

### 3.2 Check Postgres Logs

1. Go to Supabase Logs: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/logs/explorer

2. Click on "Postgres" logs

3. Filter by recent timestamp (when you tried to sign up)

4. Look for errors related to:
   - `profiles` table
   - `handle_new_user` function
   - `on_auth_user_created` trigger

5. **Copy any error messages**

---

## Step 4: Common Error Scenarios

### Error: "relation 'public.profiles' does not exist"

**Cause**: The profiles table was not created.

**Solution**:
1. Run `DATABASE_COMPLETE_SETUP.sql` in Supabase SQL Editor
2. Verify with debug script

### Error: "function public.handle_new_user() does not exist"

**Cause**: The trigger function was not created.

**Solution**:
1. Run `DATABASE_COMPLETE_SETUP.sql` in Supabase SQL Editor
2. Verify with debug script

### Error: "new row violates row-level security policy"

**Cause**: RLS policies are blocking the insert.

**Solution**:
Run this in SQL Editor:
```sql
-- Check if the trigger is using SECURITY DEFINER
SELECT p.proname, p.prosecdef
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- If prosecdef is false, recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;
```

### Error: "duplicate key value violates unique constraint"

**Cause**: Trying to sign up with an email that already exists in auth.users but not in profiles.

**Solution**:
Delete the orphaned user from Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/auth/users
2. Find the user by email
3. Click the three dots → Delete user
4. Try signing up again

---

## Step 5: Test Signup Flows

### 5.1 Test Email Signup

1. **Clear browser storage**:
   - Open DevTools (F12)
   - Application → Storage → Clear site data
   - Close DevTools

2. Go to your app's signup page

3. Open DevTools Console (F12 → Console tab)

4. Fill in signup form:
   - Full Name: Test User
   - Email: test+[random]@example.com (use different email each time)
   - Password: test1234

5. Click "Create Account"

6. **Check console for errors**

7. **Expected Result**:
   - Toast message: "Check your email to confirm your account"
   - Check Supabase → Auth → Users - user should appear
   - Check Supabase → Database → profiles table - profile should exist with same ID

### 5.2 Test Google OAuth Signup

1. **Clear browser storage** (as above)

2. Go to signup page

3. Click "Sign up with Google"

4. **Expected Flow**:
   - Redirected to Google consent screen
   - After approval, redirected back to app
   - Automatically logged in
   - Redirected to /dashboard

5. **If it fails**, check:
   - Google Cloud Console redirect URI is correct: `https://oazfwlgnlrealwpyvqbu.supabase.co/auth/v1/callback`
   - Google provider is enabled in Supabase Dashboard → Authentication → Providers

---

## Step 6: Manual Testing of Database Trigger

Test if the trigger works manually:

```sql
-- 1. Create a test user (this simulates what Supabase Auth does)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test-trigger@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name": "Test Trigger User"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- 2. Check if the profile was created
SELECT * FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'test-trigger@example.com'
);

-- 3. Clean up test data
DELETE FROM auth.users WHERE email = 'test-trigger@example.com';
```

If the profile was created, the trigger works!

---

## Step 7: Get Specific Error Details

If signup still fails after all the above, let me see:

1. **The exact error message** from:
   - Browser console
   - Supabase Auth logs
   - Supabase Postgres logs

2. **The output** from running `DEBUG_DATABASE_SETUP.sql`

3. **A screenshot** of the error (if possible)

With this information, I can provide a more specific fix.

---

## Quick Checklist

Before asking for help, verify:

- [ ] Ran `DEBUG_DATABASE_SETUP.sql` - all components exist
- [ ] Ran `DATABASE_COMPLETE_SETUP.sql` in Supabase SQL Editor
- [ ] Checked Supabase Auth logs for errors
- [ ] Checked Supabase Postgres logs for errors
- [ ] Cleared browser storage before testing
- [ ] Tested with a completely new email address
- [ ] Google OAuth redirect URI is correct (if using Google signup)
- [ ] Google provider is enabled in Supabase (if using Google signup)

---

## Most Likely Solution

**90% of signup issues are caused by not running the database migration.**

**Quick Fix**:
1. Go to: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/sql/new
2. Copy ALL of `DATABASE_COMPLETE_SETUP.sql`
3. Paste and run
4. Wait for success message
5. Try signup again

This should fix it!
