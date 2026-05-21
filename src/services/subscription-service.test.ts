import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
    auth: {},
  },
}));

vi.mock("@/data/growth-queries", () => ({
  getPremiumSelection: vi.fn(),
}));

const { normalizeTier } = await import("./subscription-service");

describe("subscription service", () => {
  it("normalizes unknown tiers to Free", () => {
    expect(normalizeTier("Gold")).toBe("Free");
    expect(normalizeTier(null)).toBe("Free");
  });

  it("preserves Plus and Pro tiers", () => {
    expect(normalizeTier("Plus")).toBe("Plus");
    expect(normalizeTier("Pro")).toBe("Pro");
  });
});
