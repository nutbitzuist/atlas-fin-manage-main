-- =====================================================
-- Migration: Create Growth Workflow Tables
-- =====================================================
-- Dedicated storage for growth workflows that started as
-- profile preference JSON. These tables support reporting,
-- RLS isolation, and future delivery integrations.

CREATE TABLE IF NOT EXISTS public.growth_referral_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed_up', 'rewarded', 'cancelled')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, invited_email)
);

CREATE TABLE IF NOT EXISTS public.money_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_key TEXT NOT NULL,
  challenge_name TEXT NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'paused', 'completed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_key)
);

CREATE TABLE IF NOT EXISTS public.household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'declined', 'cancelled')),
  permissions JSONB NOT NULL DEFAULT '{"shared_budget": true, "shared_goals": true, "private_accounts": true}'::jsonb,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inviter_user_id, invitee_email)
);

CREATE TABLE IF NOT EXISTS public.lifecycle_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding BOOLEAN NOT NULL DEFAULT true,
  weekly_review BOOLEAN NOT NULL DEFAULT true,
  monthly_close BOOLEAN NOT NULL DEFAULT true,
  bill_reminders BOOLEAN NOT NULL DEFAULT true,
  tax_season BOOLEAN NOT NULL DEFAULT true,
  milestones BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trust_center_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete_data', 'delete_account')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.premium_selections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_tier TEXT NOT NULL DEFAULT 'Free' CHECK (selected_tier IN ('Free', 'Plus', 'Pro')),
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_coach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'question_asked',
  prompt_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.growth_referral_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifecycle_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_center_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own referral invites"
  ON public.growth_referral_invites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own challenge progress"
  ON public.money_challenge_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage household invites they send"
  ON public.household_invites
  FOR ALL
  USING (auth.uid() = inviter_user_id)
  WITH CHECK (auth.uid() = inviter_user_id);

CREATE POLICY "Users manage own lifecycle email preferences"
  ON public.lifecycle_email_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own trust center requests"
  ON public.trust_center_requests
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own premium selection"
  ON public.premium_selections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert and read own AI coach events"
  ON public.ai_coach_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_growth_referral_invites_user_id ON public.growth_referral_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_referral_invites_referral_code ON public.growth_referral_invites(referral_code);
CREATE INDEX IF NOT EXISTS idx_money_challenge_progress_user_id ON public.money_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_inviter_user_id ON public.household_invites(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_trust_center_requests_user_id ON public.trust_center_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_events_user_id_created_at ON public.ai_coach_events(user_id, created_at DESC);

