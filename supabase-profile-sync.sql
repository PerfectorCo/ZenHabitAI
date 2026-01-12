-- ============================================

-- 0. Ensure profiles table has updated_at tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger function for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1. Create the profile sync function
-- This function extracts metadata from auth.users and updates profiles only if fields are empty.
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth(user_uuid uuid)
RETURNS void AS $$
DECLARE
  auth_metadata jsonb;
  auth_email text;
  profile_name TEXT;
  profile_avatar TEXT;
BEGIN
  -- Get metadata from auth.users
  SELECT raw_user_meta_data, email INTO auth_metadata, auth_email
  FROM auth.users
  WHERE id = user_uuid;

  -- Extract name from various possible metadata keys
  profile_name := COALESCE(
    auth_metadata->>'full_name',
    auth_metadata->>'name',
    auth_metadata->>'display_name'
  );

  -- Extract avatar URL
  profile_avatar := COALESCE(
    auth_metadata->>'avatar_url',
    auth_metadata->>'picture'
  );

  -- Update profile only if existing fields are empty or generic
  UPDATE public.profiles
  SET
    name = CASE
      WHEN name IS NULL OR name = '' OR name = 'Zen User' THEN COALESCE(profile_name, name)
      ELSE name
    END,
    email = CASE
      WHEN email IS NULL OR email = '' THEN COALESCE(auth_email, email)
      ELSE email
    END,
    avatar_url = CASE
      WHEN avatar_url IS NULL OR avatar_url = '' THEN COALESCE(profile_avatar, avatar_url)
      ELSE avatar_url
    END
  WHERE id = user_uuid::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the creation trigger function
-- This function handles the initial insertion of a profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Initial insert with safe defaults
  INSERT INTO public.profiles (
    id,
    name,
    email,
    avatar_url,
    joined_date,
    onboarding_completed,
    subscription
  )
  VALUES (
    new.id,
    'Zen User', -- Placeholder, will be synced immediately
    new.email,
    NULL,
    NOW(),
    false,
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Sync metadata immediately after insert
  PERFORM public.sync_profile_from_auth(new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update RLS Policies to use auth.uid()
-- This ensures strict data ownership and security.

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid()::text = id);

-- Habits Table
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habits" ON public.habits;
CREATE POLICY "Users can manage own habits"
  ON public.habits FOR ALL
  USING (auth.uid()::text = user_id);

-- Tasks Table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL
  USING (auth.uid()::text = user_id);

-- Task Templates Table
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own task_templates" ON public.task_templates;
CREATE POLICY "Users can manage own task_templates"
  ON public.task_templates FOR ALL
  USING (auth.uid()::text = user_id);

-- Focus Sessions Table
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own focus_sessions" ON public.focus_sessions;
CREATE POLICY "Users can manage own focus_sessions"
  ON public.focus_sessions FOR ALL
  USING (auth.uid()::text = user_id);

-- Categories Table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid()::text = user_id);

-- Feedback Table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own feedback" ON public.feedback;
CREATE POLICY "Users can manage own feedback"
  ON public.feedback FOR ALL
  USING (auth.uid()::text = user_id);

-- Payment Transactions Table (Configure only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
    ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
    CREATE POLICY "Users can view own payment transactions"
      ON public.payment_transactions FOR SELECT
      USING (auth.uid()::text = user_id);

    DROP POLICY IF EXISTS "Users can insert own payment transactions" ON public.payment_transactions;
    CREATE POLICY "Users can insert own payment transactions"
      ON public.payment_transactions FOR INSERT
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
