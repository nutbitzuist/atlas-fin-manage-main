import { getPremiumSelection } from "@/data/growth-queries";
import {
  featureGateConfig,
  isFeatureAvailable,
  type PremiumFeature,
  type PremiumTier,
} from "@/utils/feature-gates";

export type SubscriptionSnapshot = {
  tier: PremiumTier;
  selectedAt: string | null;
  updatedAt: string | null;
  unlockedFeatures: PremiumFeature[];
};

const normalizeTier = (value: string | null | undefined): PremiumTier => {
  if (value === "Plus" || value === "Pro") return value;
  return "Free";
};

export async function loadSubscriptionSnapshot(userId: string): Promise<SubscriptionSnapshot> {
  const premiumSelection = await getPremiumSelection(userId);
  const tier = normalizeTier(premiumSelection?.selected_tier);

  return {
    tier,
    selectedAt: premiumSelection?.selected_at ?? null,
    updatedAt: premiumSelection?.updated_at ?? null,
    unlockedFeatures: (Object.keys(featureGateConfig) as PremiumFeature[]).filter((feature) =>
      isFeatureAvailable(tier, feature),
    ),
  };
}

export { normalizeTier };
