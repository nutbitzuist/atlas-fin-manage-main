-- Make premium_frequency nullable to support various insurance payment structures
-- This allows for one-time payments, long-term prepaid policies (6-10 years),
-- and lifetime policies (until age 80/90)

ALTER TABLE public.insurance_policies
ALTER COLUMN premium_frequency DROP NOT NULL;

-- Update the comment to reflect the new flexibility
COMMENT ON COLUMN public.insurance_policies.premium_frequency IS 'Payment frequency: yearly, one-time, or null for flexible arrangements';
