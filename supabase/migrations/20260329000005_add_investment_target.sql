-- Add monthly_investment_target to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_investment_target NUMERIC DEFAULT 0;

-- Update the comment for better clarity
COMMENT ON COLUMN public.profiles.monthly_investment_target IS 'User defined monthly goal for investments (Thai Baht)';
