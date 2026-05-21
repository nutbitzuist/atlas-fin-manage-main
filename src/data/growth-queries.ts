import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

export type ChallengeDefinitionRow = {
  challenge_name: string;
  progress: number | null;
  status: string | null;
};

export type ReferralInviteRow = Tables<"growth_referral_invites">;
export type HouseholdInviteRow = Tables<"household_invites">;
export type EmailPreferenceRow = Tables<"lifecycle_email_preferences">;
export type TrustCenterRequestRow = Tables<"trust_center_requests">;
export type PremiumSelectionRow = Tables<"premium_selections">;
export type CoachEventCount = { id: number };
export type EmailPreferencesInput = {
  user_id: string;
  onboarding: boolean;
  weekly_review: boolean;
  monthly_close: boolean;
  bill_reminders: boolean;
  tax_season: boolean;
  milestones: boolean;
  updated_at: string;
};
export type ChallengePayload = {
  user_id: string;
  challenge_key: string;
  challenge_name: string;
  progress: number;
  target: number;
  status: "joined" | "paused" | "completed";
  completed_at: string | null;
  updated_at: string;
};

export async function getGrowthReferralInvites(userId: string): Promise<ReferralInviteRow[]> {
  const { data, error } = await supabase
    .from("growth_referral_invites")
    .select("invited_email, referral_code, status")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as ReferralInviteRow[]) || [];
}

export async function getMoneyChallengeProgress(userId: string): Promise<ChallengeDefinitionRow[]> {
  const { data, error } = await supabase
    .from("money_challenge_progress")
    .select("challenge_name, progress, status")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as ChallengeDefinitionRow[]) || [];
}

export async function getHouseholdInvites(userId: string): Promise<HouseholdInviteRow[]> {
  const { data, error } = await supabase
    .from("household_invites")
    .select("invitee_email")
    .eq("inviter_user_id", userId);

  if (error) throw error;
  return (data as HouseholdInviteRow[]) || [];
}

export async function getLifecycleEmailPreferences(userId: string): Promise<EmailPreferenceRow | null> {
  const { data, error } = await supabase
    .from("lifecycle_email_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as EmailPreferenceRow | null;
}

export async function getLatestTrustCenterRequest(userId: string): Promise<TrustCenterRequestRow | null> {
  const { data, error } = await supabase
    .from("trust_center_requests")
    .select("requested_at")
    .eq("user_id", userId)
    .in("request_type", ["delete_data", "delete_account"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as TrustCenterRequestRow | null;
}

export async function getPremiumSelection(userId: string): Promise<PremiumSelectionRow | null> {
  const { data, error } = await supabase
    .from("premium_selections")
    .select("selected_tier, selected_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as PremiumSelectionRow | null;
}

export async function getCoachQuestionCount(userId: string): Promise<{ count: number | null }> {
  const { count, error } = await supabase
    .from("ai_coach_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return { count: count || 0 };
}

export async function upsertReferralInvite(payload: {
  user_id: string;
  referral_code: string;
  invited_email: string;
  status: "pending";
  updated_at: string;
}) {
  const { error } = await supabase.from("growth_referral_invites").upsert(payload, {
    onConflict: "user_id,invited_email",
  });

  if (error) throw error;
}

export async function upsertChallengeProgress(payload: ChallengePayload) {
  const { error } = await supabase.from("money_challenge_progress").upsert(payload, {
    onConflict: "user_id,challenge_key",
  });

  if (error) throw error;
}

export async function upsertHouseholdInvite(payload: {
  inviter_user_id: string;
  invitee_email: string;
  status: "pending";
  updated_at: string;
}) {
  const { error } = await supabase.from("household_invites").upsert(payload, {
    onConflict: "inviter_user_id,invitee_email",
  });

  if (error) throw error;
}

export async function upsertLifecycleEmailPreferences(payload: EmailPreferencesInput) {
  const { error } = await supabase
    .from("lifecycle_email_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

export async function insertTrustRequest(payload: {
  user_id: string;
  request_type: "export" | "delete_data" | "delete_account";
  status: "requested";
}) {
  const { error } = await supabase.from("trust_center_requests").insert(payload);

  if (error) throw error;
}

export async function insertCoachQuestion(payload: {
  user_id: string;
  event_type: string;
  prompt_key: string;
}) {
  const { error } = await supabase.from("ai_coach_events").insert(payload);

  if (error) throw error;
}

export type GrowthMetadata = Record<string, Json | undefined>;

export function mapEmailPreferenceRowToRecord(row: EmailPreferenceRow | null): GrowthMetadata | null {
  if (!row) return null;

  return {
    onboarding: row.onboarding,
    weekly: row.weekly_review,
    monthly: row.monthly_close,
    bills: row.bill_reminders,
    tax: row.tax_season,
    milestones: row.milestones,
  } as unknown as GrowthMetadata;
}

export type EmailPreferencesDaoPayload = {
  userId: string;
  prefs: {
    onboarding: boolean;
    weekly: boolean;
    monthly: boolean;
    bills: boolean;
    tax: boolean;
    milestones: boolean;
  };
};

export function toEmailPreferencesRow(userId: string, prefs: EmailPreferencesDaoPayload["prefs"]) {
  return {
    user_id: userId,
    onboarding: prefs.onboarding ?? true,
    weekly_review: prefs.weekly ?? true,
    monthly_close: prefs.monthly ?? true,
    bill_reminders: prefs.bills ?? true,
    tax_season: prefs.tax ?? true,
    milestones: prefs.milestones ?? true,
    updated_at: new Date().toISOString(),
  };
}
