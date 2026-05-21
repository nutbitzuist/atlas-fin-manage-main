# Portfolio Update API - Setup Guide

This guide explains how to set up and use the secure Portfolio Update API endpoint for your MT4/MT5 Expert Advisor integration.

## Overview

The `portfolio-update` Supabase Edge Function provides a secure REST API endpoint that:
- Accepts portfolio data from MT4/MT5 Expert Advisors
- Authenticates requests using a Bearer token
- Validates incoming data
- Stores/updates portfolio status in the database
- Returns success/error responses

## Prerequisites

1. Supabase project set up
2. Supabase CLI installed (`npm install -g supabase`)
3. Database migrations applied

## Setup Instructions

### 1. Apply Database Migration

First, create the `portfolio_status` table in your Supabase database:

```bash
# Make sure you're logged in to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

Or run the SQL directly in your Supabase SQL Editor:
- Go to your Supabase Dashboard
- Navigate to SQL Editor
- Run the contents of `supabase/migrations/20251116_create_portfolio_status.sql`

### 2. Set Environment Variable

Add your API key to Supabase Edge Function secrets:

```bash
# Set your portfolio API key (use a strong, random string)
supabase secrets set PORTFOLIO_API_KEY="your-super-secret-key-here"
```

**Important:**
- Generate a strong, random API key (32+ characters recommended)
- Keep this key secret and never commit it to version control
- Use different keys for development and production

Example to generate a secure key:
```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy the Function

Deploy the portfolio-update function to Supabase:

```bash
# Deploy the function
supabase functions deploy portfolio-update

# Verify deployment
supabase functions list
```

### 4. Get Your Function URL

After deployment, your endpoint will be available at:
```
https://your-project-ref.supabase.co/functions/v1/portfolio-update
```

Replace `your-project-ref` with your actual Supabase project reference ID.

## API Documentation

### Endpoint

```
POST https://your-project-ref.supabase.co/functions/v1/portfolio-update
```

### Authentication

Include your API key in the `Authorization` header:

```
Authorization: Bearer your-super-secret-key-here
```

### Request Body

Send a JSON payload with the following structure:

```json
{
  "account_number": 123456,
  "balance": 10200.50,
  "equity": 10350.75,
  "profit": 150.25,
  "server_time": "2025-11-16 06:00:01"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `account_number` | number | **Yes** | MT4/MT5 account number (primary key) |
| `balance` | number | No | Account balance |
| `equity` | number | No | Account equity |
| `profit` | number | No | Current profit/loss |
| `server_time` | string | No | Server timestamp from MT4/MT5 |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Portfolio data updated.",
  "account_number": 123456,
  "updated_at": "2025-11-16T06:00:01.123Z"
}
```

#### Error Responses

**401 Unauthorized - Missing/Invalid Token**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header. Expected: Bearer <token>"
}
```

**401 Unauthorized - Invalid API Key**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API token"
}
```

**400 Bad Request - Missing account_number**
```json
{
  "error": "Bad Request",
  "message": "Missing or invalid required field: account_number (must be a number)"
}
```

**400 Bad Request - Invalid JSON**
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

**500 Internal Server Error**
```json
{
  "error": "Database error",
  "message": "Error details here"
}
```

## Testing the API

### Using cURL

```bash
# Replace with your actual values
PROJECT_REF="your-project-ref"
API_KEY="your-super-secret-key-here"

curl -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/portfolio-update" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 123456,
    "balance": 10200.50,
    "equity": 10350.75,
    "profit": 150.25,
    "server_time": "2025-11-16 06:00:01"
  }'
```

### Using Postman

1. Create a new POST request
2. URL: `https://your-project-ref.supabase.co/functions/v1/portfolio-update`
3. Headers:
   - `Authorization`: `Bearer your-super-secret-key-here`
   - `Content-Type`: `application/json`
4. Body (raw JSON):
   ```json
   {
     "account_number": 123456,
     "balance": 10200.50,
     "equity": 10350.75,
     "profit": 150.25,
     "server_time": "2025-11-16 06:00:01"
   }
   ```

### Using JavaScript/TypeScript

```typescript
const API_URL = "https://your-project-ref.supabase.co/functions/v1/portfolio-update";
const API_KEY = "your-super-secret-key-here";

async function updatePortfolio(data) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Success:", result);
    } else {
      console.error("Error:", result);
    }

    return result;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

// Usage
updatePortfolio({
  account_number: 123456,
  balance: 10200.50,
  equity: 10350.75,
  profit: 150.25,
  server_time: "2025-11-16 06:00:01"
});
```

## MT4/MT5 Expert Advisor Integration

### Example MQL5 Code

```mql5
// Add at the top of your EA
#property strict

// Configuration
input string API_URL = "https://your-project-ref.supabase.co/functions/v1/portfolio-update";
input string API_KEY = "your-super-secret-key-here";

// Function to send portfolio update
bool SendPortfolioUpdate() {
    // Prepare JSON data
    string data = StringFormat(
        "{\"account_number\":%d,\"balance\":%.2f,\"equity\":%.2f,\"profit\":%.2f,\"server_time\":\"%s\"}",
        AccountInfoInteger(ACCOUNT_LOGIN),
        AccountInfoDouble(ACCOUNT_BALANCE),
        AccountInfoDouble(ACCOUNT_EQUITY),
        AccountInfoDouble(ACCOUNT_PROFIT),
        TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS)
    );

    // Prepare headers
    string headers = "Authorization: Bearer " + API_KEY + "\r\n";
    headers += "Content-Type: application/json\r\n";

    // Send HTTP POST request
    char post[], result[];
    string result_headers;

    StringToCharArray(data, post, 0, StringLen(data));

    int res = WebRequest(
        "POST",
        API_URL,
        headers,
        5000,  // timeout in ms
        post,
        result,
        result_headers
    );

    if(res == 200) {
        Print("Portfolio update successful");
        return true;
    } else {
        Print("Portfolio update failed. Status: ", res);
        Print("Response: ", CharArrayToString(result));
        return false;
    }
}

// Call this function periodically (e.g., every minute)
void OnTimer() {
    SendPortfolioUpdate();
}

// Initialize timer in OnInit()
int OnInit() {
    EventSetTimer(60);  // Update every 60 seconds
    return(INIT_SUCCEEDED);
}
```

**Important for MT4/MT5:**
1. Add your API URL to the list of allowed URLs in MT4/MT5
2. Go to Tools → Options → Expert Advisors → Check "Allow WebRequest for listed URLs"
3. Add: `https://your-project-ref.supabase.co`

## Security Best Practices

1. **Never expose your API key**
   - Don't hardcode it in client-side code
   - Use environment variables
   - Rotate keys periodically

2. **Use HTTPS only**
   - Supabase Edge Functions use HTTPS by default
   - Never send the API key over HTTP

3. **Monitor usage**
   - Check Supabase logs regularly
   - Set up alerts for unusual activity

4. **Implement rate limiting** (optional)
   - Consider adding rate limiting to prevent abuse
   - Monitor request frequency

## Querying Portfolio Data

Once data is stored, you can query it from your frontend:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get latest portfolio status for an account
async function getPortfolioStatus(accountNumber: number) {
  const { data, error } = await supabase
    .from('portfolio_status')
    .select('*')
    .eq('account_number', accountNumber)
    .single();

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
}

// Get all portfolio accounts
async function getAllPortfolios() {
  const { data, error } = await supabase
    .from('portfolio_status')
    .select('*')
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return [];
  }

  return data;
}
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check that your API key is correct
   - Ensure you're using `Bearer` prefix in Authorization header
   - Verify the environment variable is set in Supabase

2. **400 Bad Request**
   - Validate your JSON payload structure
   - Ensure `account_number` is included and is a number
   - Check data types match the specification

3. **500 Internal Server Error**
   - Check Supabase function logs: `supabase functions logs portfolio-update`
   - Verify the database table exists
   - Check RLS policies allow the operation

4. **CORS Errors**
   - CORS is enabled by default in the function
   - If testing from browser, ensure proper headers are sent

### View Function Logs

```bash
# View recent logs
supabase functions logs portfolio-update

# Stream logs in real-time
supabase functions logs portfolio-update --tail
```

## Support

For issues or questions:
1. Check Supabase function logs
2. Verify database table structure
3. Test with cURL to isolate issues
4. Review error messages in the response

## Next Steps

1. ✅ Deploy the function
2. ✅ Set up environment variables
3. ✅ Test with cURL
4. ✅ Integrate with your MT4/MT5 EA
5. ✅ Build frontend to display portfolio data
6. 📊 Consider adding historical data tracking
7. 🔔 Set up notifications for important events
