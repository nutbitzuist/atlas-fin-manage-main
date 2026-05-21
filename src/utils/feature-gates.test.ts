import { describe, expect, it } from "vitest";
import { featureGateConfig, isFeatureAvailable } from "./feature-gates";

describe("feature gates", () => {
  it("treats Plus as enough for household mode", () => {
    expect(isFeatureAvailable("Plus", "household")).toBe(true);
    expect(isFeatureAvailable("Free", "household")).toBe(false);
  });

  it("requires Pro for coach and growth dashboard features", () => {
    expect(isFeatureAvailable("Plus", "ai_coach")).toBe(false);
    expect(isFeatureAvailable("Pro", "ai_coach")).toBe(true);
    expect(isFeatureAvailable("Plus", "growth_dashboard")).toBe(false);
    expect(isFeatureAvailable("Pro", "growth_dashboard")).toBe(true);
  });

  it("defines the expected required tiers for premium features", () => {
    expect(featureGateConfig.household.requiredTier).toBe("Plus");
    expect(featureGateConfig.ai_coach.requiredTier).toBe("Pro");
    expect(featureGateConfig.growth_dashboard.requiredTier).toBe("Pro");
  });
});
