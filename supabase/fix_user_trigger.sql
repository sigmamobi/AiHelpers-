-- supabase/fix_user_trigger.sql
-- SQL script to fix the user creation trigger issue in Supabase.
-- This script will:
-- 1. Drop existing trigger and function if they exist to ensure a clean slate.
-- 2. Create a new `handle_new_user` function with explicit schema references and improved error handling/logging.
-- 3. Recreate the `on_auth_user_created` trigger with correct permissions.
-- 4. Provide a function for manual user profile creation in `public.users` and `public.user_settings`
--    in case the automatic trigger fails for a specific `auth.users` entry.

-- Suppress notices for cleaner output during execution
SET client_min_messages TO WARNING;

-- 1. Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create a new `handle_new_user` function with explicit schema references and improved error handling/logging.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a user profile already exists to prevent duplicates
    IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        RAISE NOTICE 'User profile for ID % already exists. Skipping creation.', NEW.id;
        RETURN NEW;
    END IF;

    -- Create a record in the public.users table
    INSERT INTO public.users (id, email, username)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1))
    ON CONFLICT (id) DO NOTHING; -- Handle potential race conditions or pre-existing entries

    -- Create default user settings in public.user_settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING; -- Handle potential race conditions or pre-existing entries

    RAISE NOTICE 'Successfully created user profile and settings for ID %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating user profile for ID %: %', NEW.id, SQLERRM;
        RETURN NULL; -- Or handle as appropriate, e.g., log and return NEW
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a new trigger with correct permissions
-- This trigger will fire AFTER a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create a function for manual user profile creation (if automatic trigger fails)
-- This function can be called manually from the SQL Editor if a user exists in auth.users
-- but their profile was not created in public.users or public.user_settings.
CREATE OR REPLACE FUNCTION public.create_user_profile_manually(auth_user_id UUID, user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_exists BOOLEAN;
    settings_exists BOOLEAN;
BEGIN
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
        RETURN 'Error during manual profile creation for ID ' || auth_user_id || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset client_min_messages to default
RESET client_min_messages;

-- Example usage for manual creation (run in Supabase SQL Editor if needed):
-- SELECT public.create_user_profile_manually('UUID_OF_AUTH_USER', 'email@example.com');
-- Replace 'UUID_OF_AUTH_USER' with the actual ID from auth.users
-- Replace 'email@example.com' with the actual email from auth.users
