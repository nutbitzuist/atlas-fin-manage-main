-- Fix function_search_path_mutable warnings
-- Setting search_path to empty string prevents search path injection attacks

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix create_default_categories_for_user
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
  VALUES 
    (p_user_id, 'Salary', 'income', 'Briefcase', '#22c55e', true),
    (p_user_id, 'Freelance', 'income', 'Laptop', '#3b82f6', true),
    (p_user_id, 'Investments', 'income', 'TrendingUp', '#8b5cf6', true),
    (p_user_id, 'Other Income', 'income', 'Plus', '#6b7280', true);
  
  -- Insert default expense categories
  INSERT INTO public.categories (user_id, name, type, icon, color, is_default)
  VALUES 
    (p_user_id, 'Food & Dining', 'expense', 'Utensils', '#ef4444', true),
    (p_user_id, 'Transportation', 'expense', 'Car', '#f97316', true),
    (p_user_id, 'Shopping', 'expense', 'ShoppingBag', '#eab308', true),
    (p_user_id, 'Bills & Utilities', 'expense', 'Receipt', '#14b8a6', true),
    (p_user_id, 'Entertainment', 'expense', 'Film', '#ec4899', true),
    (p_user_id, 'Healthcare', 'expense', 'Heart', '#f43f5e', true),
    (p_user_id, 'Education', 'expense', 'GraduationCap', '#6366f1', true),
    (p_user_id, 'Other Expenses', 'expense', 'MoreHorizontal', '#6b7280', true);
END;
$$;

-- Fix create_categories_for_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.create_categories_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.create_default_categories_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Fix update_categories_updated_at
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_api_key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  key text;
BEGIN
  key := encode(gen_random_bytes(32), 'hex');
  RETURN key;
END;
$$;

-- Fix update_emergency_fund_updated_at
CREATE OR REPLACE FUNCTION public.update_emergency_fund_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_tax_planning_updated_at
CREATE OR REPLACE FUNCTION public.update_tax_planning_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_net_worth_goals_updated_at
CREATE OR REPLACE FUNCTION public.update_net_worth_goals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix cleanup_old_unused_api_keys
CREATE OR REPLACE FUNCTION public.cleanup_old_unused_api_keys()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.api_keys
  WHERE last_used_at IS NULL
    AND created_at < now() - interval '30 days'
    AND is_active = true;
END;
$$;

-- Fix create_bill_reminder_notifications
CREATE OR REPLACE FUNCTION public.create_bill_reminder_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  bill_record RECORD;
BEGIN
  FOR bill_record IN
    SELECT b.id, b.user_id, b.name, b.due_date, b.amount
    FROM public.bills b
    WHERE b.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '7 days'
      AND b.status = 'pending'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      bill_record.user_id,
      'bill_reminder',
      'Bill Due Soon: ' || bill_record.name,
      'Your bill "' || bill_record.name || '" of ' || bill_record.amount || ' is due on ' || bill_record.due_date,
      jsonb_build_object('bill_id', bill_record.id)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Fix create_budget_alert_notifications
CREATE OR REPLACE FUNCTION public.create_budget_alert_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  budget_record RECORD;
BEGIN
  FOR budget_record IN
    SELECT b.id, b.user_id, b.name, b.amount, b.spent
    FROM public.budgets b
    WHERE b.spent >= b.amount * 0.9
      AND b.period_start <= CURRENT_DATE
      AND b.period_end >= CURRENT_DATE
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      budget_record.user_id,
      'budget_alert',
      'Budget Alert: ' || budget_record.name,
      'You have used ' || round((budget_record.spent / budget_record.amount) * 100) || '% of your budget',
      jsonb_build_object('budget_id', budget_record.id)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Fix create_goal_progress_notifications
CREATE OR REPLACE FUNCTION public.create_goal_progress_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  goal_record RECORD;
BEGIN
  FOR goal_record IN
    SELECT g.id, g.user_id, g.name, g.target_amount, g.current_amount
    FROM public.savings_goals g
    WHERE g.current_amount >= g.target_amount * 0.5
      AND g.current_amount < g.target_amount
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      goal_record.user_id,
      'goal_progress',
      'Goal Progress: ' || goal_record.name,
      'You are ' || round((goal_record.current_amount / goal_record.target_amount) * 100) || '% toward your goal!',
      jsonb_build_object('goal_id', goal_record.id)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Fix create_insurance_renewal_notifications
CREATE OR REPLACE FUNCTION public.create_insurance_renewal_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT p.id, p.user_id, p.policy_name, p.end_date
    FROM public.insurance_policies p
    WHERE p.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '30 days'
      AND p.status = 'active'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      policy_record.user_id,
      'insurance_renewal',
      'Insurance Renewal: ' || policy_record.policy_name,
      'Your policy "' || policy_record.policy_name || '" expires on ' || policy_record.end_date,
      jsonb_build_object('policy_id', policy_record.id)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
