import { logAuditEvent } from "@/services/audit-service";
import { getProfilePreferences, updateProfilePreferences } from "@/services/profile-service";
import type { Json, Tables } from "@/integrations/supabase/types";
import {
  getCoachQuestionCount,
  getGrowthReferralInvites,
  getHouseholdInvites,
  getLatestTrustCenterRequest,
  getLifecycleEmailPreferences,
  getMoneyChallengeProgress,
  getPremiumSelection,
  insertCoachQuestion,
  insertTrustRequest,
  upsertChallengeProgress as upsertChallengeProgressQuery,
  upsertHouseholdInvite as upsertHouseholdInviteQuery,
  upsertLifecycleEmailPreferences,
  toEmailPreferencesRow,
  upsertReferralInvite as upsertReferralInviteQuery,
} from "@/data/growth-queries";

export type ChallengeState = Record<string, { joined: boolean; progress: number }>;

export type GrowthState = {
  referralCode: string;
  invitedEmails: string[];
  friendSignups: number;
  rewardsEarned: number;
  challenges: ChallengeState;
  householdInvites: string[];
  deletionRequestedAt: string | null;
  premiumTier: "Free" | "Plus" | "Pro";
  emailPrefs: Record<string, boolean>;
  coachQuestionsAsked: number;
};

export type ChallengeDefinition = {
  name: string;
  progress: number;
  total: number;
};

type ProfilePreferences = Record<string, Json | undefined> & {
  atlas_growth?: Partial<GrowthState>;
};

const toProfilePreferences = (preferences: Json | null | undefined): ProfilePreferences => {
  if (preferences && typeof preferences === "object" && !Array.isArray(preferences)) {
    return preferences as ProfilePreferences;
  }
  return {};
};

const challengeKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createReferralCode = () => "ATLAS-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export const defaultGrowthState = (): GrowthState => ({
  referralCode: createReferralCode(),
  invitedEmails: [],
  friendSignups: 0,
  rewardsEarned: 0,
  challenges: {},
  householdInvites: [],
  deletionRequestedAt: null,
  premiumTier: "Free",
  emailPrefs: {
    onboarding: true,
    weekly: true,
    monthly: true,
    bills: true,
    tax: true,
    milestones: true,
  },
  coachQuestionsAsked: 0,
});

const emailPrefsFromRow = (row: Tables<"lifecycle_email_preferences"> | null): Record<string, boolean> | null => {
  if (!row) return null;
  return {
    onboarding: row.onboarding,
    weekly: row.weekly_review,
    monthly: row.monthly_close,
    bills: row.bill_reminders,
    tax: row.tax_season,
    milestones: row.milestones,
  };
};

export async function loadGrowthState(userId: string, challengeDefinitions: ChallengeDefinition[]) {
  const base = defaultGrowthState();
  const profilePreferences = await getProfilePreferences(userId);

  const preferences = toProfilePreferences(profilePreferences);
  const saved = preferences.atlas_growth as Partial<GrowthState> | undefined;
  const profileState: GrowthState = saved
    ? {
        ...base,
        ...saved,
        emailPrefs: { ...base.emailPrefs, ...(saved.emailPrefs || {}) },
        challenges: saved.challenges || {},
        invitedEmails: saved.invitedEmails || [],
        householdInvites: saved.householdInvites || [],
      }
    : base;

  const [
    referrals,
    challengeRows,
    householdRows,
    emailPrefRow,
    trustRow,
    premiumSelection,
    coachRes,
  ] = await Promise.all([
    getGrowthReferralInvites(userId),
    getMoneyChallengeProgress(userId),
    getHouseholdInvites(userId),
    getLifecycleEmailPreferences(userId),
    getLatestTrustCenterRequest(userId),
    getPremiumSelection(userId),
    getCoachQuestionCount(userId),
  ]);

  const challenges = { ...profileState.challenges };
  challengeRows.forEach((challenge) => {
    challenges[challenge.challenge_name] = {
      joined: challenge.status === "joined" || challenge.status === "completed",
      progress: Number(challenge.progress || 0),
    };
  });

  challengeDefinitions.forEach((definition) => {
    if (!challenges[definition.name]) return;
    challenges[definition.name].progress = Number(challenges[definition.name].progress || definition.progress);
  });

  const premiumTier = premiumSelection?.selected_tier;
  const emailPrefs = emailPrefsFromRow(emailPrefRow) || profileState.emailPrefs;

  return {
    ...profileState,
    referralCode: referrals[0]?.referral_code || profileState.referralCode,
    invitedEmails: referrals.map((invite) => invite.invited_email),
    friendSignups: referrals.filter((invite) => invite.status === "signed_up" || invite.status === "rewarded").length,
    rewardsEarned: referrals.filter((invite) => invite.status === "rewarded").length,
    challenges,
    householdInvites: householdRows.map((invite) => invite.invitee_email),
    deletionRequestedAt: trustRow?.requested_at || profileState.deletionRequestedAt,
    premiumTier: premiumTier === "Plus" || premiumTier === "Pro" ? premiumTier : "Free",
    emailPrefs,
    coachQuestionsAsked: coachRes.count ?? profileState.coachQuestionsAsked,
  } satisfies GrowthState;
}

export async function saveLegacyGrowthState(userId: string, nextState: GrowthState) {
  const existingPreferences = await getProfilePreferences(userId);
  const preferences = toProfilePreferences(existingPreferences);
  await updateProfilePreferences(userId, { ...preferences, atlas_growth: nextState } as Json);
  void logAuditEvent({
    user_id: userId,
    event_type: "growth_state_saved",
    entity_type: "profiles",
    entity_id: userId,
    metadata: {
      source: "legacy_profile_sync",
      fields_count: Object.keys(nextState).length,
    },
  });
}

export async function trackReferralInvite(userId: string, referralCode: string, invitedEmail: string) {
  await upsertReferralInviteQuery({
    user_id: userId,
    referral_code: referralCode,
    invited_email: invitedEmail,
    status: "pending",
    updated_at: new Date().toISOString(),
  });
  void logAuditEvent({
    user_id: userId,
    event_type: "referral_invite_created",
    entity_type: "growth_referral_invites",
    metadata: { referral_code: referralCode, invited_email: invitedEmail },
  });
}

export async function upsertChallengeProgress(userId: string, definition: ChallengeDefinition, joined: boolean, progress: number) {
  const completed = progress >= definition.total;
  await upsertChallengeProgressQuery({
    user_id: userId,
    challenge_key: challengeKey(definition.name),
    challenge_name: definition.name,
    progress,
    target: definition.total,
    status: completed ? "completed" : joined ? "joined" : "paused",
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });
}

export async function trackHouseholdInvite(userId: string, inviteeEmail: string) {
  await upsertHouseholdInviteQuery({
    inviter_user_id: userId,
    invitee_email: inviteeEmail,
    status: "pending",
    updated_at: new Date().toISOString(),
  });
  void logAuditEvent({
    user_id: userId,
    event_type: "household_invite_created",
    entity_type: "household_invites",
    metadata: { invitee_email: inviteeEmail },
  });
}

export async function updateLifecycleEmailPreferences(userId: string, prefs: Record<string, boolean>) {
  await upsertLifecycleEmailPreferences(toEmailPreferencesRow(userId, prefs));
}

export async function trackTrustRequest(userId: string, requestType: "export" | "delete_data" | "delete_account") {
  await insertTrustRequest({
    user_id: userId,
    request_type: requestType,
    status: "requested",
  });
  void logAuditEvent({
    user_id: userId,
    event_type: "trust_request_created",
    entity_type: "trust_center_requests",
    metadata: { request_type: requestType },
  });
}

export async function trackCoachQuestion(userId: string, promptKey = "guided_prompt") {
  await insertCoachQuestion({
    user_id: userId,
    event_type: "question_asked",
    prompt_key: promptKey,
  });
  void logAuditEvent({
    user_id: userId,
    event_type: "ai_coach_question_asked",
    entity_type: "ai_coach_events",
    metadata: { prompt_key: promptKey },
  });
}
