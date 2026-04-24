-- Add onboarding_completed flag to profiles table
-- If profiles table doesn't exist, create it
CREATE TABLE IF NOT EXISTS profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          text,
  business_name         text,
  onboarding_completed  boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_select" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_self_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- If profiles table already exists, just add the column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name text;
