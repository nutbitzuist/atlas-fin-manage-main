export type PremiumTier = "Free" | "Plus" | "Pro";

export type PremiumFeature = "household" | "ai_coach" | "growth_dashboard";

export type FeatureGateConfig = {
  feature: PremiumFeature;
  label: string;
  requiredTier: Exclude<PremiumTier, "Free">;
  description: string;
};

const tierRank: Record<PremiumTier, number> = {
  Free: 0,
  Plus: 1,
  Pro: 2,
};

export const featureGateConfig: Record<PremiumFeature, FeatureGateConfig> = {
  household: {
    feature: "household",
    label: "Household / Couple Mode",
    requiredTier: "Plus",
    description: "Shared budgets, goals, and bill coordination require Plus.",
  },
  ai_coach: {
    feature: "ai_coach",
    label: "AI Finance Coach",
    requiredTier: "Pro",
    description: "Guided coaching prompts and saved coach history require Pro.",
  },
  growth_dashboard: {
    feature: "growth_dashboard",
    label: "Analytics & Growth Dashboard",
    requiredTier: "Pro",
    description: "Growth analytics and activation telemetry are reserved for Pro.",
  },
};

export const isFeatureAvailable = (tier: PremiumTier, feature: PremiumFeature) =>
  tierRank[tier] >= tierRank[featureGateConfig[feature].requiredTier];

export const getTierLabel = (tier: PremiumTier) => {
  if (tier === "Plus") return "Plus";
  if (tier === "Pro") return "Pro";
  return "Free";
};
