/*
  # User Profiles and Business Setup Schema
  
  ## Overview
  Complete database schema for ExpenseIQ - Smart expense management system
  
  ## 1. User Profiles Table
    - `id` (uuid, primary key) - Links to auth.users
    - `email` (text) - User email
    - `full_name` (text) - User's full name
    - `avatar_url` (text) - Profile picture URL
    - `phone` (text) - Phone number
    - `onboarding_completed` (boolean) - Onboarding status
    - `preferences` (jsonb) - User preferences (currency, language, etc.)
    - `created_at` (timestamptz) - Account creation date
    - `updated_at` (timestamptz) - Last update date
  
  ## 2. Businesses Table
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key) - Owner
    - `name` (text) - Business name
    - `business_type` (text) - Industry type
    - `tax_id` (text) - Tax ID/EIN
    - `address` (jsonb) - Business address
    - `is_default` (boolean) - Default business for user
    - `settings` (jsonb) - Business-specific settings
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  ## Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Policies for select, insert, update, delete operations
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  onboarding_completed boolean DEFAULT false,
  preferences jsonb DEFAULT '{"currency": "USD", "language": "en", "timezone": "UTC"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text DEFAULT 'Other',
  tax_id text,
  address jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  settings jsonb DEFAULT '{"fiscal_year_start": "01-01"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_is_default ON businesses(user_id, is_default);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Businesses Policies
CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
