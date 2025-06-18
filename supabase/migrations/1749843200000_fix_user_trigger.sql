-- Fix user creation trigger issues
-- This migration addresses problems with the handle_new_user trigger
-- that causes "Database error creating new user" errors

-- 1. Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a record in the public.users table if it doesn't exist
    INSERT INTO public.users (id, email, username)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1))
    ON CONFLICT (id) DO NOTHING;
    
    -- Create default user settings if they don't exist
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in handle_new_user for ID %: %', NEW.id, SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create new trigger that fires after user creation in auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create helper function for manual profile creation if needed
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
    END IF;

    -- Check if user settings already exist
    SELECT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = auth_user_id) INTO settings_exists;

    IF NOT settings_exists THEN
        INSERT INTO public.user_settings (user_id)
        VALUES (auth_user_id);
    END IF;

    RETURN 'Manual profile creation completed for user ' || auth_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error during manual profile creation for ID ' || auth_user_id || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
