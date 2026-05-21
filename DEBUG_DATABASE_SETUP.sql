-- ========================================
-- DATABASE SETUP VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check if everything is set up correctly
-- ========================================

-- 1. Check if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE '✓ profiles table EXISTS';
    ELSE
        RAISE NOTICE '✗ profiles table MISSING - THIS IS THE PROBLEM!';
    END IF;
END $$;

-- 2. Check profiles table structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        RAISE NOTICE '✓ profiles.full_name column exists';
    ELSE
        RAISE NOTICE '✗ profiles.full_name column MISSING';
    END IF;
END $$;

-- 3. Check if handle_new_user function exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE '✓ handle_new_user() function EXISTS';
    ELSE
        RAISE NOTICE '✗ handle_new_user() function MISSING - THIS IS THE PROBLEM!';
    END IF;
END $$;

-- 4. Check if the trigger exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        RAISE NOTICE '✓ on_auth_user_created trigger EXISTS';
    ELSE
        RAISE NOTICE '✗ on_auth_user_created trigger MISSING - THIS IS THE PROBLEM!';
    END IF;
END $$;

-- 5. List all tables in public schema
SELECT
    '📋 Tables in database:' as info,
    array_agg(tablename ORDER BY tablename) as tables
FROM pg_tables
WHERE schemaname = 'public';

-- 6. Count triggers on auth.users table
SELECT
    '🔧 Triggers on auth.users:' as info,
    COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- 7. Check RLS on profiles table
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname = 'profiles'
        AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE '✓ Row Level Security is ENABLED on profiles';
    ELSE
        RAISE NOTICE '⚠ Row Level Security is DISABLED on profiles';
    END IF;
END $$;

-- 8. List all functions in public schema
SELECT
    '⚙️ Functions in public schema:' as info,
    array_agg(proname ORDER BY proname) as functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- ========================================
-- SUMMARY
-- ========================================
DO $$
DECLARE
    has_profiles boolean;
    has_function boolean;
    has_trigger boolean;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE SETUP VERIFICATION SUMMARY';
    RAISE NOTICE '========================================';

    -- Check profiles table
    SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') INTO has_profiles;

    -- Check function
    SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user') INTO has_function;

    -- Check trigger
    SELECT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'on_auth_user_created') INTO has_trigger;

    IF has_profiles AND has_function AND has_trigger THEN
        RAISE NOTICE '✅ All components are in place!';
        RAISE NOTICE 'If signup still fails, check the error logs.';
    ELSE
        RAISE NOTICE '❌ MISSING COMPONENTS DETECTED:';
        IF NOT has_profiles THEN
            RAISE NOTICE '   - profiles table is MISSING';
        END IF;
        IF NOT has_function THEN
            RAISE NOTICE '   - handle_new_user() function is MISSING';
        END IF;
        IF NOT has_trigger THEN
            RAISE NOTICE '   - on_auth_user_created trigger is MISSING';
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ ACTION REQUIRED:';
        RAISE NOTICE 'You need to run DATABASE_COMPLETE_SETUP.sql';
    END IF;

    RAISE NOTICE '========================================';
END $$;
