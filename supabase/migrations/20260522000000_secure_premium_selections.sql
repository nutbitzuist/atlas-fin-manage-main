-- Security hardening: prevent clients from mutating premium_entitlement state.
-- Entitlement changes must come from the trusted billing webhook/service role.

DROP POLICY IF EXISTS "Users manage own premium selection" ON public.premium_selections;

CREATE POLICY "Users can read own premium selection"
ON public.premium_selections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
