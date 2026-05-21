#!/bin/bash

# Portfolio API - Quick Setup Script
# Run this to set up everything automatically

echo "========================================"
echo "Portfolio API Setup"
echo "========================================"
echo ""

# Step 1: Login to Supabase
echo "Step 1: Login to Supabase..."
supabase login

# Step 2: Link project
echo ""
echo "Step 2: Linking to project..."
supabase link --project-ref oazfwlgnlrealwpyvqbu

# Step 3: Deploy function
echo ""
echo "Step 3: Deploying portfolio-update function..."
supabase functions deploy portfolio-update

# Step 4: Generate API key
echo ""
echo "========================================"
echo "Step 4: Generating API Key..."
echo "========================================"
API_KEY=$(openssl rand -hex 32)
echo ""
echo "✓ Generated API Key:"
echo "$API_KEY"
echo ""
echo "IMPORTANT: Save this key! You'll need it for:"
echo "1. Setting Supabase secret (next step)"
echo "2. Giving to Gemini for MT4/MT5 EA"
echo ""
read -p "Press Enter to continue and set this as your secret..."

# Step 5: Set secret
echo ""
echo "Step 5: Setting API key as Supabase secret..."
supabase secrets set PORTFOLIO_API_KEY="$API_KEY"

# Step 6: Summary
echo ""
echo "========================================"
echo "✓ SETUP COMPLETE!"
echo "========================================"
echo ""
echo "Your API Details:"
echo "========================================"
echo ""
echo "1. API URL:"
echo "https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/portfolio-update"
echo ""
echo "2. Secret Key:"
echo "$API_KEY"
echo ""
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Run the database migration (see below)"
echo "2. Test the API (run: ./test-portfolio-api.sh)"
echo "3. Give the API URL and Secret Key to Gemini"
echo ""
echo "Database Migration:"
echo "Go to: https://supabase.com/dashboard/project/oazfwlgnlrealwpyvqbu/editor"
echo "Run the SQL from: supabase/migrations/20251116_create_portfolio_status.sql"
echo ""
echo "========================================"
echo ""

# Save to file for reference
echo "Saving configuration to api-config.txt..."
cat > api-config.txt << EOF
API URL: https://oazfwlgnlrealwpyvqbu.supabase.co/functions/v1/portfolio-update
Secret Key: $API_KEY
Generated: $(date)
EOF

echo "✓ Configuration saved to: api-config.txt"
echo ""
