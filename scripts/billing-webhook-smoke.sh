#!/usr/bin/env bash
set -euo pipefail

# Required environment
: "${SUPABASE_URL:?Set SUPABASE_URL (e.g. https://xyz.supabase.co)}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY in this terminal for admin read checks}"
: "${BILLING_WEBHOOK_SECRET:?Set BILLING_WEBHOOK_SECRET used by the provider header x-billing-webhook-secret}"
: "${TEST_USER_ID:?Set TEST_USER_ID to a staging user id for webhook verification}"

SUPABASE_FUNCTION_URL="${SUPABASE_FUNCTION_URL:-${SUPABASE_URL%/}/functions/v1/billing-webhook}"
TIMESTAMP=$(date +%s)

curl_post_json() {
  local label=$1
  local payload=$2
  local response_file
  local code
  response_file=$(mktemp)

  printf "\n[1/3] Posting %s...\n" "${label}"
  code=$(curl -sS -o "${response_file}" -w "%{http_code}" \
    -X POST "${SUPABASE_FUNCTION_URL}" \
    -H "content-type: application/json" \
    -H "x-billing-webhook-secret: ${BILLING_WEBHOOK_SECRET}" \
    --data "${payload}")

  echo "HTTP ${code}:"
  cat "${response_file}"
  rm -f "${response_file}"
  if [[ "${code}" != 200 ]]; then
    echo "Webhook call failed; stopping smoke tests."
    exit 1
  fi
}

check_snapshot() {
  local label=$1
  printf "\n[check] %s\n" "${label}"
  curl -sS \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    "${SUPABASE_URL%/}/rest/v1/premium_selections?select=selected_tier,updated_at&user_id=eq.${TEST_USER_ID}"

  echo "[check] billing events"
  curl -sS \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    "${SUPABASE_URL%/}/rest/v1/billing_events?select=provider_event_id,subscription_tier,event_type,created_at&user_id=eq.${TEST_USER_ID}&order=created_at.desc&limit=5"
}

check_snapshot "initial"

curl_post_json "upgrade-plus" "{\
  \"provider_event_id\": \"smoke-plus-${TIMESTAMP}-01\",\
  \"user_id\": \"${TEST_USER_ID}\",\
  \"provider\": \"ops-smoke\",\
  \"event_type\": \"subscription.updated\",\
  \"subscription_tier\": \"Plus\",\
  \"status\": \"active\"\
}"
sleep 1
check_snapshot "after-upgrade-plus"

curl_post_json "downgrade-to-free-cancelled" "{\
  \"provider_event_id\": \"smoke-cancel-${TIMESTAMP}-02\",\
  \"user_id\": \"${TEST_USER_ID}\",\
  \"provider\": \"ops-smoke\",\
  \"event_type\": \"subscription.canceled\",\
  \"subscription_tier\": \"Plus\",\
  \"status\": \"canceled\"\
}"
sleep 1
check_snapshot "after-cancel"

curl_post_json "replay-plus-webhook" "{\
  \"provider_event_id\": \"smoke-plus-${TIMESTAMP}-01\",\
  \"user_id\": \"${TEST_USER_ID}\",\
  \"provider\": \"ops-smoke\",\
  \"event_type\": \"subscription.updated\",\
  \"subscription_tier\": \"Plus\",\
  \"status\": \"active\"\
}"
check_snapshot "after-idempotency"

printf "\nSmoke test completed.\n"
echo "If snapshots look wrong, check billing_events rows for the provider_event_id values above and provider log output in the Edge Function."
