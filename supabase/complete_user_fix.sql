-- supabase/complete_user_fix.sql
-- Comprehensive SQL script to fix user creation issues in Supabase.
-- This script addresses common problems with the `handle_new_user` trigger
-- and related RLS policies, ensuring robust user profile creation.

-- Set client_min_messages to NOTICE for verbose output during execution in SQL Editor.
-- This helps in debugging by showing RAISE NOTICE messages.
SET client_min_messages TO NOTICE;

-- =============================================================================
-- 1. Cleanup: Drop existing trigger and function if they exist
--    This ensures a clean slate before recreating them.
-- =============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================================
-- 2. Create/Recreate `handle_new_user` Function
--    This function is triggered after a new user is inserted into `auth.users`.
--    It creates corresponding entries in `public.users` and `public.user_settings`.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Trigger handle_new_user fired for new auth.user ID: %', NEW.id;

    -- Ensure the user profile does not already exist in public.users
    -- This handles potential race conditions or manual pre-creation
    INSERT INTO public.users (id, email, username)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1))
    ON CONFLICT (id) DO NOTHING; -- If user already exists, do nothing

    IF NOT FOUND THEN
        RAISE NOTICE 'User profile for ID % already existed or was not inserted.', NEW.id;
    ELSE
        RAISE NOTICE 'Successfully inserted user profile for ID % into public.users.', NEW.id;
    END IF;

    -- Create default user settings in public.user_settings
    -- This ensures every new user has a default settings entry
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING; -- If settings already exist, do nothing

    IF NOT FOUND THEN
        RAISE NOTICE 'User settings for ID % already existed or were not inserted.', NEW.id;
    ELSE
        RAISE NOTICE 'Successfully inserted default user settings for ID % into public.user_settings.', NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in handle_new_user for ID %: %', NEW.id, SQLERRM;
        -- Re-raise the exception to prevent user creation if profile creation fails critically
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER is crucial for trigger to bypass RLS on public.users/user_settings

-- =============================================================================
-- 3. Create/Recreate `on_auth_user_created` Trigger
--    This trigger links `auth.users` to `public.handle_new_user` function.
-- =============================================================================

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE 'Trigger on_auth_user_created and function handle_new_user have been successfully created/recreated.';

-- =============================================================================
-- 4. Manual Profile Creation Function (for existing auth.users entries)
--    This function can be used to manually create user profiles and settings
--    for users who might have registered before the trigger was correctly set up.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_user_profile_manually(auth_user_id UUID, user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_exists BOOLEAN;
    settings_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Attempting manual profile creation for auth.user ID: %', auth_user_id;

    -- Check if user profile already exists
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth_user_id) INTO user_exists;

    IF NOT user_exists THEN
        INSERT INTO public.users (id, email, username)
        VALUES (auth_user_id, user_email, SPLIT_PART(user_email, '@', 1));
        RAISE NOTICE 'Manually created user profile for ID %', auth_user_id;
    ELSE
        RAISE NOTICE 'User profile for ID % already exists. Skipping user creation.', auth_user_id;
    END IF;

    -- Check if user settings already exist
    SELECT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = auth_user_id) INTO settings_exists;

    IF NOT settings_exists THEN
        INSERT INTO public.user_settings (user_id)
        VALUES (auth_user_id);
        RAISE NOTICE 'Manually created user settings for ID %', auth_user_id;
    ELSE
        RAISE NOTICE 'User settings for ID % already exists. Skipping settings creation.', auth_user_id;
    END IF;

    RETURN 'Manual profile creation process completed for user ' || auth_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error during manual profile creation for ID %: %', auth_user_id, SQLERRM;
        RETURN 'Error during manual profile creation for ID ' || auth_user_id || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Function create_user_profile_manually has been created.';

-- =============================================================================
-- 5. Verification and Debugging Tips
-- =============================================================================

RAISE NOTICE 'Please verify the following in your Supabase Dashboard:';
RAISE NOTICE '1. Table Editor: Ensure public.users and public.user_settings tables exist with correct columns.';
RAISE NOTICE '2. Authentication -> Policies: Ensure RLS is enabled for public.users and public.user_settings, and policies allow authenticated users to manage their own data.';
RAISE NOTICE '3. Database -> Functions: Verify that handle_new_user and create_user_profile_manually functions exist.';
RAISE NOTICE '4. Database -> Triggers: Verify that on_auth_user_created trigger exists and is enabled.';
RAISE NOTICE '5. After a new user signs up, check public.users and public.user_settings tables for new entries.';
RAISE NOTICE 'If manual creation is needed, use: SELECT public.create_user_profile_manually(''UUID_FROM_AUTH_USERS'', ''email@example.com'');';

-- Reset client_min_messages to default after script execution
RESET client_min_messages;
