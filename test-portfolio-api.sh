#!/bin/bash

# Portfolio API Test Script
# Usage: ./test-portfolio-api.sh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Portfolio Update API Test Script${NC}"
echo "=================================="
echo ""

# Configuration
read -p "Enter your Supabase Project Reference: " PROJECT_REF
read -p "Enter your API Key: " API_KEY

if [ -z "$PROJECT_REF" ] || [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: Project reference and API key are required${NC}"
    exit 1
fi

API_URL="https://${PROJECT_REF}.supabase.co/functions/v1/portfolio-update"

echo ""
echo -e "${YELLOW}Testing endpoint: ${NC}${API_URL}"
echo ""

# Test 1: Valid request
echo -e "${YELLOW}Test 1: Valid portfolio update${NC}"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_URL}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 123456,
    "balance": 10200.50,
    "equity": 10350.75,
    "profit": 150.25,
    "server_time": "2025-11-16 06:00:01"
  }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "Response: $HTTP_BODY"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Status: $HTTP_STATUS"
    echo "Response: $HTTP_BODY"
fi

echo ""
echo "=================================="
echo ""

# Test 2: Missing account_number
echo -e "${YELLOW}Test 2: Missing required field (should fail with 400)${NC}"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_URL}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 10200.50,
    "equity": 10350.75
  }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$HTTP_STATUS" -eq 400 ]; then
    echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
    echo "Response: $HTTP_BODY"
else
    echo -e "${RED}✗ FAILED (Should have returned 400)${NC}"
    echo "Status: $HTTP_STATUS"
    echo "Response: $HTTP_BODY"
fi

echo ""
echo "=================================="
echo ""

# Test 3: Invalid authorization
echo -e "${YELLOW}Test 3: Invalid API key (should fail with 401)${NC}"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_URL}" \
  -H "Authorization: Bearer invalid-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 123456,
    "balance": 10200.50
  }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$HTTP_STATUS" -eq 401 ]; then
    echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
    echo "Response: $HTTP_BODY"
else
    echo -e "${RED}✗ FAILED (Should have returned 401)${NC}"
    echo "Status: $HTTP_STATUS"
    echo "Response: $HTTP_BODY"
fi

echo ""
echo "=================================="
echo ""

# Test 4: Missing authorization header
echo -e "${YELLOW}Test 4: Missing Authorization header (should fail with 401)${NC}"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 123456,
    "balance": 10200.50
  }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$HTTP_STATUS" -eq 401 ]; then
    echo -e "${GREEN}✓ PASSED (Correctly rejected)${NC}"
    echo "Response: $HTTP_BODY"
else
    echo -e "${RED}✗ FAILED (Should have returned 401)${NC}"
    echo "Status: $HTTP_STATUS"
    echo "Response: $HTTP_BODY"
fi

echo ""
echo "=================================="
echo ""

# Test 5: Minimal valid request (only account_number)
echo -e "${YELLOW}Test 5: Minimal valid request (only account_number)${NC}"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${API_URL}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "account_number": 789012
  }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "Response: $HTTP_BODY"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Status: $HTTP_STATUS"
    echo "Response: $HTTP_BODY"
fi

echo ""
echo "=================================="
echo -e "${GREEN}Testing complete!${NC}"
echo ""
