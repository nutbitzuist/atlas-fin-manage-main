DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Users can insert own notifications'
  ) THEN
    CREATE POLICY "Users can insert own notifications"
      ON public.notifications
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_type_metadata
  ON public.notifications(user_id, type, ((metadata->>'dedupe_key')));
