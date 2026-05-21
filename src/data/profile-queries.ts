import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export async function getProfileByIdRaw(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileDisplayNameRaw(userId: string, fallback = "User") {
  const profile = await getProfileByIdRaw(userId);
  return profile?.full_name || fallback;
}

export async function updateProfileRaw(userId: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function getProfilePreferencesRaw(userId: string): Promise<Json | null | undefined> {
  const profile = await getProfileByIdRaw(userId);
  return profile?.preferences;
}

type ProfilePreferenceSection = "app_preferences" | "notifications" | "atlas_growth";

export async function updateProfilePreferencesRaw(userId: string, preferences: Json) {
  const { error } = await supabase
    .from("profiles")
    .update({
      preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function updateProfilePreferenceSectionRaw(
  userId: string,
  section: ProfilePreferenceSection,
  value: Json,
) {
  const profile = await getProfileByIdRaw(userId);
  const existing = (profile?.preferences && typeof profile.preferences === "object" && !Array.isArray(profile.preferences))
    ? profile.preferences
    : {};
  const next = {
    ...(typeof existing === "object" && existing !== null ? existing : {}),
    [section]: value,
  } as Json;

  await updateProfilePreferencesRaw(userId, next);
}
