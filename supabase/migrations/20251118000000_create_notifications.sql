-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'bill', 'budget', 'goal', 'insurance')),
  is_read boolean NOT NULL DEFAULT false,
  link text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert notifications (for system-generated notifications)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create bill reminder notifications
CREATE OR REPLACE FUNCTION public.create_bill_reminder_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notifications for bills due in 3 days
  INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
  SELECT
    b.user_id,
    'Bill Reminder',
    b.name || ' is due in 3 days',
    'bill',
    '/bills',
    jsonb_build_object('bill_id', b.id, 'amount', b.amount, 'due_date', b.due_date)
  FROM public.bills b
  WHERE b.is_paid = false
    AND b.due_date = CURRENT_DATE + INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = b.user_id
        AND n.type = 'bill'
        AND n.metadata->>'bill_id' = b.id::text
        AND n.created_at > CURRENT_DATE
    );
END;
$$;

-- Function to create budget alert notifications
CREATE OR REPLACE FUNCTION public.create_budget_alert_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  budget_record RECORD;
  spent_amount numeric;
  percentage numeric;
BEGIN
  FOR budget_record IN
    SELECT b.*, p.default_currency
    FROM public.budgets b
    JOIN public.profiles p ON p.id = b.user_id
    WHERE b.period_start <= CURRENT_DATE
      AND b.period_end >= CURRENT_DATE
  LOOP
    -- Calculate spent amount for this budget
    SELECT COALESCE(SUM(t.amount), 0) INTO spent_amount
    FROM public.transactions t
    WHERE t.user_id = budget_record.user_id
      AND t.category_id = budget_record.category_id
      AND t.date >= budget_record.period_start
      AND t.date <= budget_record.period_end
      AND t.type = 'expense';

    -- Calculate percentage
    percentage := (spent_amount / NULLIF(budget_record.amount, 0)) * 100;

    -- Create notification if spent >= 80% and no recent notification exists
    IF percentage >= 80 AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = budget_record.user_id
        AND n.type = 'budget'
        AND n.metadata->>'budget_id' = budget_record.id::text
        AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
    ) THEN
      INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
      VALUES (
        budget_record.user_id,
        'Budget Alert',
        'You''ve reached ' || ROUND(percentage, 0)::text || '% of your budget',
        'budget',
        '/budget',
        jsonb_build_object(
          'budget_id', budget_record.id,
          'percentage', percentage,
          'spent', spent_amount,
          'limit', budget_record.amount
        )
      );
    END IF;
  END LOOP;
END;
$$;

-- Function to create savings goal progress notifications
CREATE OR REPLACE FUNCTION public.create_goal_progress_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goal_record RECORD;
  percentage numeric;
  milestone integer;
BEGIN
  FOR goal_record IN
    SELECT * FROM public.savings_goals
    WHERE target_amount > 0
  LOOP
    percentage := (goal_record.current_amount / goal_record.target_amount) * 100;

    -- Check for milestone achievements (25%, 50%, 75%, 100%)
    FOR milestone IN SELECT unnest(ARRAY[25, 50, 75, 100])
    LOOP
      IF percentage >= milestone AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = goal_record.user_id
          AND n.type = 'goal'
          AND n.metadata->>'goal_id' = goal_record.id::text
          AND n.metadata->>'milestone' = milestone::text
      ) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
        VALUES (
          goal_record.user_id,
          CASE
            WHEN milestone = 100 THEN 'Goal Achieved!'
            ELSE 'Goal Progress'
          END,
          CASE
            WHEN milestone = 100 THEN 'Congratulations! You''ve reached your ' || goal_record.name || ' goal!'
            ELSE 'You''ve reached ' || milestone::text || '% of your ' || goal_record.name || ' goal!'
          END,
          'goal',
          '/savings-goals',
          jsonb_build_object(
            'goal_id', goal_record.id,
            'milestone', milestone,
            'current_amount', goal_record.current_amount,
            'target_amount', goal_record.target_amount
          )
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Function to create insurance renewal notifications
CREATE OR REPLACE FUNCTION public.create_insurance_renewal_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notifications for insurance policies expiring in 30 days
  INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
  SELECT
    i.user_id,
    'Insurance Renewal Reminder',
    i.policy_name || ' expires in 30 days',
    'insurance',
    '/insurance',
    jsonb_build_object(
      'insurance_id', i.id,
      'policy_name', i.policy_name,
      'end_date', i.end_date
    )
  FROM public.insurance_policies i
  WHERE i.end_date = CURRENT_DATE + INTERVAL '30 days'
    AND i.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = i.user_id
        AND n.type = 'insurance'
        AND n.metadata->>'insurance_id' = i.id::text
        AND n.created_at > CURRENT_DATE
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_bill_reminder_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_budget_alert_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_goal_progress_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_insurance_renewal_notifications() TO service_role;
