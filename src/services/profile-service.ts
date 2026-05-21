import type { Json } from "@/integrations/supabase/types";
import type { Profile } from "@/data/profile-queries";
import {
  getProfileByIdRaw,
  getProfileDisplayNameRaw,
  getProfilePreferencesRaw,
  updateProfilePreferenceSectionRaw,
  updateProfilePreferencesRaw,
  updateProfileRaw,
} from "@/data/profile-queries";

export type { Profile } from "@/data/profile-queries";

export async function getProfileById(userId: string) {
  return getProfileByIdRaw(userId);
}

export async function getProfileDisplayName(userId: string, fallback = "User") {
  return getProfileDisplayNameRaw(userId, fallback);
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  return updateProfileRaw(userId, updates);
}

export async function getProfilePreferences(userId: string): Promise<Json | null | undefined> {
  return getProfilePreferencesRaw(userId);
}

export async function updateProfilePreferences(userId: string, preferences: Json) {
  return updateProfilePreferencesRaw(userId, preferences);
}

export async function updateProfilePreferenceSection(
  userId: string,
  section: "app_preferences" | "notifications" | "atlas_growth",
  value: Json,
) {
  return updateProfilePreferenceSectionRaw(userId, section, value);
}
