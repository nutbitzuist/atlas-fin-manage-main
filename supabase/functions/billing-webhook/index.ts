import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type BillingTier = "Free" | "Plus" | "Pro";

type BillingWebhookPayload = {
  user_id?: string;
  id?: string;
  event_id?: string;
  eventId?: string;
  provider?: string;
  provider_event_id?: string;
  event_type?: string;
  data?: Record<string, unknown> | null;
  subscription_tier?: BillingTier | string;
  selected_tier?: BillingTier | string;
  status?: string;
  payload?: Record<string, unknown>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-billing-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizeTier = (value: unknown): BillingTier => {
  if (value === "Plus" || value === "Pro") return value;
  return "Free";
};

const toStringId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const isCancellationStatus = (status: string | null) => {
  if (!status) return false;

  return [
    "canceled",
    "cancelled",
    "expired",
    "incomplete_expired",
    "unsubscribed",
    "terminated",
    "void",
    "voided",
  ].includes(status);
};

const getStatusFromPayload = (payload: Record<string, unknown> | undefined): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const direct = normalizeString(payload.status);
  if (direct) return direct;

  const nested =
    (payload.data as Record<string, unknown> | undefined)?.object ||
    (payload.event as Record<string, unknown> | undefined);

  if (!nested || typeof nested !== "object") return null;
  return normalizeString((nested as Record<string, unknown>).status);
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const getProviderEventId = (body: BillingWebhookPayload) => {
  const payload = asObject(body.payload);
  const nested = asObject(payload?.data) || asObject(payload?.event) || asObject(payload?.object);
  const nestedEvent = asObject((payload as Record<string, unknown>)?.event);

  const candidates = [
    body.provider_event_id,
    body.id,
    body.event_id,
    body.eventId,
    payload?.id,
    payload?.event_id,
    payload?.eventId,
    nested?.id,
    nested?.event_id,
    nestedEvent?.id,
  ].flatMap((value) => toStringId(value));

  return candidates.length ? candidates[0] : null;
};

const shouldDowngradeToFree = (status: string | null, eventType: string) => {
  return isCancellationStatus(status) || eventType.includes("deleted") || eventType.includes("cancel") || eventType.includes("expire");
};

const resolveTier = (body: BillingWebhookPayload) => {
  const eventType = normalizeString(body.event_type || "") || "";
  const status = normalizeString(body.status) || getStatusFromPayload(body.payload);
  const selectedTier = normalizeTier(body.subscription_tier ?? body.selected_tier);

  if (shouldDowngradeToFree(status, eventType)) {
    return "Free";
  }

  return selectedTier;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("BILLING_WEBHOOK_SECRET");
  const incomingSecret = req.headers.get("x-billing-webhook-secret");

  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Billing function not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: BillingWebhookPayload;
  try {
    body = await req.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid payload format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = toStringId(body.user_id);
  const provider = body.provider?.trim() || "manual";
  const providerEventId = getProviderEventId(body);
  const eventType = body.event_type?.trim() || "subscription.updated";
  const tier = resolveTier(body);
  const status = normalizeString(body.status) || getStatusFromPayload(body.payload);

  if (!providerEventId) {
    return new Response(JSON.stringify({ error: "Missing provider_event_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const eventPayload = body.payload ?? {
    status,
    subscription_tier: tier,
  };

  if (typeof eventPayload !== "object" || eventPayload === null) {
    return new Response(JSON.stringify({ error: "Invalid payload format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: eventError } = await supabase.from("billing_events").upsert({
    user_id: userId || null,
    provider,
    provider_event_id: providerEventId,
    event_type: eventType,
    subscription_tier: tier,
    payload: eventPayload,
    processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "provider_event_id",
  });

  if (eventError) {
    return new Response(JSON.stringify({ error: eventError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (userId) {
    const { error: entitlementError } = await supabase.from("premium_selections").upsert({
      user_id: userId,
      selected_tier: tier,
      selected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

    if (entitlementError) {
      return new Response(JSON.stringify({ error: entitlementError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("audit_events").insert({
      user_id: userId,
      event_type: "billing_event_processed",
      entity_type: "billing_events",
      entity_id: null,
      metadata: {
        provider,
        provider_event_id: providerEventId,
        subscription_tier: tier,
        event_type: eventType,
      },
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    user_id: userId,
    provider,
    provider_event_id: providerEventId,
    subscription_tier: tier,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
