const normalizeUrl = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const billingConfig = {
  checkoutUrlPlus: normalizeUrl(import.meta.env.VITE_CHECKOUT_URL_PLUS),
  checkoutUrlPro: normalizeUrl(import.meta.env.VITE_CHECKOUT_URL_PRO),
  billingPortalUrl: normalizeUrl(import.meta.env.VITE_BILLING_PORTAL_URL),
};

export const getCheckoutUrlForTier = (tier: "Free" | "Plus" | "Pro") => {
  if (tier === "Plus") return billingConfig.checkoutUrlPlus;
  if (tier === "Pro") return billingConfig.checkoutUrlPro;
  return null;
};
