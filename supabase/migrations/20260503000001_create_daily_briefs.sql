CREATE TABLE IF NOT EXISTS public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  action_count INTEGER NOT NULL DEFAULT 0,
  top_action_title TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, brief_date)
);

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily briefs"
  ON public.daily_briefs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily briefs"
  ON public.daily_briefs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily briefs"
  ON public.daily_briefs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_briefs_user_date
  ON public.daily_briefs(user_id, brief_date DESC);
