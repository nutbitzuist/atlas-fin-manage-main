-- Add is_default field to savings_goals to mark system-created goals
ALTER TABLE public.savings_goals 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Add monthly_savings_target to profiles for user-declared monthly savings amount
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_savings_target numeric(15,2) DEFAULT 0;

-- Create function to auto-create Emergency Fund goal for new users
CREATE OR REPLACE FUNCTION public.create_default_savings_goals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create Emergency Fund goal as default
  INSERT INTO public.savings_goals (
    user_id,
    name,
    target_amount,
    current_amount,
    currency,
    category,
    description,
    is_default
  ) VALUES (
    NEW.id,
    'Emergency Fund',
    180000, -- Default 6 months at 30k/month
    0,
    'THB',
    'Emergency',
    'Build 3-6 months of living expenses for unexpected events. This is essential for financial security.',
    true
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to call function on new user profile creation
DROP TRIGGER IF EXISTS on_profile_created_create_savings_goals ON public.profiles;
CREATE TRIGGER on_profile_created_create_savings_goals
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_savings_goals();

-- Add index for faster default goal queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_is_default ON public.savings_goals(user_id, is_default)
WHERE is_default = true;

-- Add Emergency category to getCategoryIcon function support
COMMENT ON COLUMN public.savings_goals.is_default IS 'True for system-created goals like Emergency Fund';
COMMENT ON COLUMN public.profiles.monthly_savings_target IS 'User-declared monthly savings amount in THB';
