# Portfolio API Setup Guide (User-Specific API Keys)

This guide will walk you through setting up the multi-tenant Portfolio API system where **each user generates their own API keys**.

## System Overview

This system has two main components:

1. **API Key Management** - Users can generate their own API keys in the dashboard
2. **Portfolio Data Ingestion** - External sources (MT4/MT5 EAs) send data using user-specific API keys

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project: `oazfwlgnlrealwpyvqbu`
- Access to Supabase Dashboard

---

## Step 1: Database Migration

Run the SQL migration to create the necessary tables.

### Option A: Via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/sql/new)
2. Open the SQL Editor
3. Click **"New Query"**
4. Copy and paste the entire contents of `supabase/migrations/20251116_create_api_keys_system.sql`
5. Click **Run** or press `Ctrl+Enter`
6. You should see: **"Success. No rows returned"**

### Option B: Via Supabase CLI

```bash
cd /home/user/atlas-fin-manage
supabase db push
```

### What This Creates

- **`api_keys` table**: Stores user-generated API keys
  - `id` (UUID, primary key)
  - `user_id` (foreign key to auth.users)
  - `api_key` (unique, indexed) - Format: `api_key_[32 hex chars]`
  - `name` (user-defined label, e.g., "MT4 Account 1")
  - `is_active` (allows revoking keys without deletion)
  - `last_used_at` (security monitoring timestamp)
  - `created_at` (when key was generated)

- **Updated `portfolio_status` table**: Now multi-tenant
  - Added `user_id` column (links to API key owner)
  - Changed from single `account_number` primary key to `id` (UUID)
  - Added unique constraint on `(user_id, account_number)` - prevents duplicate accounts per user

---

## Step 2: Deploy Edge Functions

Deploy the two Edge Functions to Supabase.

### 2.1 Login to Supabase CLI

```bash
supabase login
```

This will open your browser. Login with your Supabase account.

### 2.2 Link to Your Project

```bash
cd /home/user/atlas-fin-manage
supabase link --project-ref oazfwlgnlrealwpyvqbu
```

When prompted, enter your database password.

### 2.3 Deploy the Functions

```bash
# Deploy generate-api-key function (protected route for authenticated users)
supabase functions deploy generate-api-key

# Deploy portfolio-update function (public endpoint with API key validation)
supabase functions deploy portfolio-update
```

### Verify Deployment

Check that both functions are deployed:

```bash
supabase functions list
```

You should see:
- ✅ `generate-api-key` - For authenticated users to create API keys
- ✅ `portfolio-update` - For MT4/MT5 EAs to send data

---

## Step 3: User Workflow (How Your Users Will Use This)

### For End Users:

1. **Login to FinDash OS**
   - Users must have a registered account

2. **Navigate to Settings → Security Tab**
   - Click on "Generate New Key" button
   - Optionally provide a name (e.g., "MT4 Account 1", "Live Trading Account")
   - Click "Generate Key"

3. **Copy the API Key** (⚠️ ONE TIME ONLY!)
   - The key will be displayed only once: `api_key_a1b2c3d4e5f6...`
   - Copy and save it securely
   - **WARNING:** Once the dialog is closed, the key cannot be retrieved again!

4. **Configure MT4/MT5 Expert Advisor**
   - Provide the API key to the EA configuration
   - EA will use this key to authenticate and send data

5. **Monitor API Key Usage**
   - View all keys in Settings → Security
   - See when each key was last used
   - Revoke or delete keys as needed
   - Maximum 10 active keys per user

---

## Step 4: API Endpoint Details

### Endpoint 1: Generate API Key (Protected)

**URL:** `https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/generate-api-key`

**Method:** `POST`

**Authentication:** Requires Supabase Auth session token (users must be logged in)

**Request Headers:**
```
Authorization: Bearer <user_session_token>
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "name": "MT4 Account 1"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "API key generated successfully",
  "api_key": "api_key_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "key_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "MT4 Account 1",
  "created_at": "2025-11-16T10:30:00Z",
  "warning": "⚠️ IMPORTANT: Save this key now. You won't be able to see it again!"
}
```

**Rate Limits:**
- Maximum 10 active API keys per user
- Returns 429 (Too Many Keys) if limit reached

---

### Endpoint 2: Portfolio Update (Public with API Key Auth)

**URL:** `https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/portfolio-update`

**Method:** `POST`

**Authentication:** User-specific API key via Bearer token

**Request Headers:**
```
Authorization: Bearer api_key_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
Content-Type: application/json
```

**Request Body:**
```json
{
  "account_number": 123456,
  "balance": 10200.50,
  "equity": 10350.75,
  "profit": 150.25,
  "server_time": "2025-11-16 06:00:01"
}
```

**Field Descriptions:**
- `account_number` (required): MT4/MT5 account number (integer)
- `balance` (optional): Account balance (decimal)
- `equity` (optional): Account equity (decimal)
- `profit` (optional): Current profit/loss (decimal)
- `server_time` (optional): MT4/MT5 server timestamp (string)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Portfolio data updated successfully",
  "account_number": 123456,
  "updated_at": "2025-11-16T06:00:02Z"
}
```

**Error Responses:**

| Status | Error | Meaning |
|--------|-------|---------|
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | API key has been revoked by user |
| 400 | Bad Request | Missing required field (account_number) or invalid data type |
| 429 | Too Many Requests | Rate limit exceeded (if implemented) |
| 500 | Internal Server Error | Database or server error |

---

## Step 5: Security Features

### Multi-Tenant Isolation

- ✅ Each API key is linked to a specific user
- ✅ Data is automatically associated with the key owner
- ✅ Users can only see their own portfolio data
- ✅ No cross-user data leakage possible
- ✅ Row Level Security (RLS) enforces data isolation

### Key Management

- **Generate**: Users can create multiple keys (max 10 active)
- **Revoke**: Disable keys without deleting them (maintains audit trail)
- **Delete**: Permanently remove keys
- **Monitor**: Track when keys were last used for security auditing
- **Masked Display**: Keys are displayed as `api_key_****...1234` in the UI

### Rate Limiting

- Maximum 10 active keys per user
- Prevents API abuse
- Can be extended with per-key rate limits in future

---

## Step 6: Testing the System

### Test 1: Generate an API Key (from Dashboard)

1. Login to your FinDash OS dashboard
2. Go to Settings → Security
3. Click "Generate New Key"
4. Enter a name: "Test Key 1"
5. Click "Generate Key"
6. Copy the generated key (e.g., `api_key_1234abcd...`)

### Test 2: Test the Portfolio Update API

Replace `YOUR_API_KEY` with the key you just generated:

```bash
curl -X POST \
  https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/portfolio-update \
  -H "Authorization: Bearer api_key_YOUR_ACTUAL_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 123456,
    "balance": 10200.50,
    "equity": 10350.75,
    "profit": 150.25,
    "server_time": "2025-11-16 06:00:01"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Portfolio data updated successfully",
  "account_number": 123456,
  "updated_at": "2025-11-16T06:00:02Z"
}
```

### Test 3: Verify Data in Supabase

1. Go to [Supabase Table Editor](https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/editor)
2. Select the `portfolio_status` table
3. You should see your test data with:
   - `user_id` matching your logged-in user
   - `account_number` = 123456
   - All the portfolio metrics you sent

### Test 4: Check "Last Used At" Timestamp

1. Go back to Settings → Security in the dashboard
2. Find your "Test Key 1"
3. The "Last Used" column should now show the current time

---

## Step 7: For MT4/MT5 Integration (For Gemini AI)

Provide these details to Gemini AI for Expert Advisor development:

### API Configuration

**API Endpoint:**
```
https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/portfolio-update
```

**Authentication Method:**
- Each user generates their own API key from Settings → Security
- Key format: `api_key_[32 hex characters]`
- Send in HTTP header: `Authorization: Bearer <api_key>`

**Request Format:**

```
POST /functions/v1/portfolio-update
Host: oazfwlgnlrealwpyvqbu.supabase.co

Headers:
  Authorization: Bearer api_key_USER_GENERATED_KEY
  Content-Type: application/json

Body:
{
  "account_number": <AccountNumber()>,
  "balance": <AccountBalance()>,
  "equity": <AccountEquity()>,
  "profit": <AccountProfit()>,
  "server_time": "<TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS)>"
}
```

**MT4 Code Reference (for Gemini):**

```mql4
// Configuration
string API_URL = "https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/portfolio-update";
string API_KEY = "api_key_USER_MUST_ENTER_THEIR_KEY"; // User provides this

// Send data every 60 seconds
void SendPortfolioData() {
    string headers = "Authorization: Bearer " + API_KEY + "\r\nContent-Type: application/json\r\n";

    string json = "{";
    json += "\"account_number\":" + IntegerToString(AccountNumber()) + ",";
    json += "\"balance\":" + DoubleToString(AccountBalance(), 2) + ",";
    json += "\"equity\":" + DoubleToString(AccountEquity(), 2) + ",";
    json += "\"profit\":" + DoubleToString(AccountProfit(), 2) + ",";
    json += "\"server_time\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
    json += "}";

    char post[], result[];
    StringToCharArray(json, post, 0, StringLen(json));

    int res = WebRequest("POST", API_URL, headers, 5000, post, result, headers);

    if(res == 200) {
        Print("Portfolio data sent successfully");
    } else {
        Print("Error sending data. HTTP code: ", res);
    }
}
```

---

## Step 8: Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   User Dashboard                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Settings → Security → API Keys                 │ │
│  │  [Generate New Key] [View Keys] [Revoke]       │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ Supabase Auth Session
                       ↓
       ┌───────────────────────────────────┐
       │   generate-api-key Function       │
       │   (Protected Route)               │
       │   ✓ Validates user session        │
       │   ✓ Generates api_key_* key       │
       │   ✓ Saves to api_keys table       │
       │   ✓ Returns key (one time only)   │
       └───────────────────────────────────┘
                       ↓
              [User copies API key]
                       ↓
       ┌───────────────────────────────────┐
       │   MT4/MT5 Expert Advisor          │
       │   ✓ Configured with user's API key│
       │   ✓ Sends data every 60s          │
       └───────────────────────────────────┘
                       │ Bearer Token
                       ↓
       ┌───────────────────────────────────┐
       │   portfolio-update Function       │
       │   (Public Endpoint)               │
       │   ✓ Validates API key             │
       │   ✓ Looks up user_id from key     │
       │   ✓ Checks if key is active       │
       │   ✓ Upserts to portfolio_status   │
       │   ✓ Updates last_used_at          │
       └───────────────────────────────────┘
                       ↓
       ┌───────────────────────────────────┐
       │   portfolio_status Table          │
       │   (user_id, account_number, ...)  │
       │   ✓ Multi-tenant data storage     │
       │   ✓ RLS policies enforce isolation│
       │   ✓ Unique per (user, account)    │
       └───────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Invalid API key"

**Cause:** Wrong key or key not in database

**Solution:**
1. Go to Settings → Security
2. Check if the key exists and is active
3. Generate a new key if needed
4. Make sure you're using the full key including `api_key_` prefix

### Issue: "This API key has been revoked"

**Cause:** Key was disabled by user

**Solution:**
1. Go to Settings → Security
2. Find the key and click "Activate"
3. OR generate a new key

### Issue: "Too Many Keys" (429 error)

**Cause:** User has reached maximum of 10 active keys

**Solution:**
1. Go to Settings → Security
2. Revoke or delete unused keys
3. Then generate a new one

### Issue: "Failed to generate API key"

**Cause:** User not logged in or session expired

**Solution:**
1. Logout and login again
2. Try generating the key again

### Issue: Database error on upsert

**Cause:** Migration not run correctly

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Re-run the migration SQL
3. Check for any error messages

### Issue: Function not found (404)

**Cause:** Edge Functions not deployed

**Solution:**
```bash
supabase login
supabase link --project-ref oazfwlgnlrealwpyvqbu
supabase functions deploy generate-api-key
supabase functions deploy portfolio-update
```

### View Function Logs

```bash
# See recent errors for generate-api-key
supabase functions logs generate-api-key

# See recent errors for portfolio-update
supabase functions logs portfolio-update

# Stream logs live
supabase functions logs portfolio-update --tail
```

---

## Verification Checklist

Before going live, verify:

- [ ] SQL migration executed successfully
- [ ] Both Edge Functions deployed (`generate-api-key` and `portfolio-update`)
- [ ] Can generate API key from dashboard Settings → Security
- [ ] API key appears in the list (masked format)
- [ ] Test cURL request with generated key returns success
- [ ] Data appears in `portfolio_status` table with correct `user_id`
- [ ] "Last Used" timestamp updates after API call
- [ ] Can revoke and reactivate keys
- [ ] Can delete keys
- [ ] Maximum key limit (10) is enforced

---

## Security Best Practices

### For Users:

1. ✅ **Never share your API key** - Each key is personal to your account
2. ✅ **Store keys securely** - Use password managers or secure configuration files
3. ✅ **Revoke unused keys** - Disable keys for EAs you're no longer using
4. ✅ **Monitor key usage** - Check "Last Used" timestamps for suspicious activity
5. ✅ **Use descriptive names** - Name keys to identify which EA or account they're for

### For Developers:

1. ✅ **Never log full API keys** - Only log first 8 and last 4 characters
2. ✅ **Use HTTPS only** - All requests must be over HTTPS
3. ✅ **Implement rate limiting** - Consider per-key rate limits for production
4. ✅ **Monitor for abuse** - Track failed authentication attempts
5. ✅ **Audit trail** - Keep `last_used_at` and `created_at` for security audits

---

## Summary

✅ **Step 1:** Run SQL migration → Creates `api_keys` table and updates `portfolio_status`

✅ **Step 2:** Deploy both Edge Functions → `generate-api-key` and `portfolio-update`

✅ **Step 3:** Users generate API keys from dashboard → Settings → Security

✅ **Step 4:** Users configure MT4/MT5 EA with their personal API key

✅ **Step 5:** EA sends data every 60s → Authenticated with user's key

✅ **Step 6:** Dashboard displays real-time portfolio data → Isolated per user

**Your multi-tenant Portfolio API is now ready!** 🚀

Each user has their own API keys, their own data, and complete isolation from other users' data.

---

## Next Steps

1. ✅ Complete this setup
2. 📱 Test the dashboard UI (Settings → Security)
3. 🔧 Provide API URL to Gemini for EA development
4. 📊 Build dashboard page to display `portfolio_status` data
5. 🔔 Add real-time updates using Supabase Realtime
6. 📈 Add historical tracking and charts
