-- AI Assistant App Database Schema
-- This schema defines the tables, indexes, and security policies for the AI Assistant application
-- Based on the technical requirements document

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users Table
-- Stores information about registered users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username TEXT,
    avatar_url TEXT
);

CREATE INDEX idx_users_email ON users(email);

-- Assistants Table
-- Stores information about predefined custom AI assistants
CREATE TABLE assistants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL UNIQUE,
    name_ru TEXT NOT NULL UNIQUE,
    description_en TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    prompt TEXT NOT NULL,
    icon_url TEXT,
    category_en TEXT NOT NULL,
    category_ru TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assistants_name_en ON assistants(name_en);
CREATE INDEX idx_assistants_name_ru ON assistants(name_ru);
CREATE INDEX idx_assistants_category_en ON assistants(category_en);
CREATE INDEX idx_assistants_category_ru ON assistants(category_ru);

-- Chats Table
-- Stores information about conversations between users and AI assistants
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_assistant_id ON chats(assistant_id);

-- Messages Table
-- Stores all messages in chats
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);

-- User Settings Table
-- Stores individual user settings for the AI model and application preferences
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    temperature NUMERIC NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 1000,
    model_name TEXT NOT NULL DEFAULT 'gpt-4',
    language TEXT NOT NULL DEFAULT 'en',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assistant Prompts History Table (optional, for admin use)
-- Tracks changes to assistant prompts for versioning or audit
CREATE TABLE assistant_prompts_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    old_prompt TEXT,
    new_prompt TEXT NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aph_assistant_id ON assistant_prompts_history(assistant_id);

-- Feedback Table (optional)
-- Collects user feedback on AI responses
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_message_id ON feedback(message_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistants_updated_at
BEFORE UPDATE ON assistants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON chats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update chat's updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats SET updated_at = NOW() WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_timestamp_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_prompts_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_own ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_delete_own ON users
    FOR DELETE USING (auth.uid() = id);

-- Assistants table policies
CREATE POLICY assistants_select_active ON assistants
    FOR SELECT USING (is_active = TRUE);

-- Only admin role can manage assistants (INSERT, UPDATE, DELETE)
-- Note: This requires setting up custom roles in Supabase Auth

-- Chats table policies
CREATE POLICY chats_select_own ON chats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY chats_insert_own ON chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY chats_update_own ON chats
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY chats_delete_own ON chats
    FOR DELETE USING (user_id = auth.uid());

-- Messages table policies
CREATE POLICY messages_select_own_chats ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );

CREATE POLICY messages_insert_own_chats ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND chats.user_id = auth.uid()
        )
    );

-- User Settings table policies
CREATE POLICY user_settings_select_own ON user_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_settings_insert_own ON user_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_update_own ON user_settings
    FOR UPDATE USING (user_id = auth.uid());

-- Assistant Prompts History table policies (admin only)
-- This will be configured when admin roles are set up

-- Feedback table policies
CREATE POLICY feedback_insert_own ON feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only admins can view feedback
-- This will be configured when admin roles are set up

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a record in the users table
    INSERT INTO users (id, email, username)
    VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
    
    -- Create default user settings
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user when a user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- INITIAL DATA (OPTIONAL)
-- =============================================================================

-- Insert a default admin user
-- Note: In production, use a secure method to set up the first admin user
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
-- VALUES (
--     uuid_generate_v4(),
--     'admin@example.com',
--     crypt('securepassword', gen_salt('bf')),
--     NOW()
-- );

-- Note: Initial assistants data will be added through a separate seed file
