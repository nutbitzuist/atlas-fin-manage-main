-- =====================================================
-- Migration: Add Profile Preferences
-- =====================================================
-- Adds a JSONB column for user preferences (date format,
-- number format, budget start day, etc.)

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSONB: dateFormat, numberFormat, budgetStartDay, firstDayOfWeek, language, theme';
