-- ============================================
-- ZenHabit AI - Complete Database Setup
-- Copy this entire script into Supabase SQL Editor
-- ============================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  bio TEXT,
  main_goal TEXT,
  custom_goal_options JSONB,
  hidden_standard_goals JSONB,
  avatar_url TEXT,
  joined_date TIMESTAMP,
  onboarding_completed BOOLEAN,
  subscription TEXT
);

-- 2. Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  completed_dates JSONB,
  created_at TIMESTAMP,
  target_count INTEGER,
  streak INTEGER,
  time_spent_minutes INTEGER,
  reminder_time TEXT
);

-- 3. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN,
  completed_dates JSONB,
  skipped_dates JSONB,
  repeat_days JSONB,
  time_spent INTEGER,
  created_at TIMESTAMP,
  reminder_time TEXT,
  is_recurring BOOLEAN
);

-- 4. Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  is_recurring BOOLEAN,
  repeat_days JSONB
);

-- 5. Create focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT,
  goal_title TEXT,
  duration_minutes INTEGER,
  timestamp TIMESTAMP
);

-- 6. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL
);

-- 7. Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT,
  message TEXT,
  timestamp TIMESTAMP
);

-- ============================================
-- Row Level Security (RLS) Setup
-- ============================================
-- Note: Since the app uses custom user IDs (not Supabase Auth),
-- you may want to disable RLS or adjust policies based on your auth setup.

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Adjust based on your auth setup

-- Create policies for habits table
CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL
  USING (true); -- Adjust based on your auth setup

-- Create policies for tasks table
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (true); -- Adjust based on your auth setup

-- Create policies for task_templates table
CREATE POLICY "Users can manage own task_templates"
  ON task_templates FOR ALL
  USING (true); -- Adjust based on your auth setup

-- Create policies for focus_sessions table
CREATE POLICY "Users can manage own focus_sessions"
  ON focus_sessions FOR ALL
  USING (true); -- Adjust based on your auth setup

-- Create policies for categories table
CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  USING (true); -- Adjust based on your auth setup

-- Create policies for feedback table
CREATE POLICY "Users can manage own feedback"
  ON feedback FOR ALL
  USING (true); -- Adjust based on your auth setup

-- ============================================
-- Optional: If using custom user IDs (not Supabase Auth),
-- you may want to disable RLS instead:
-- ============================================
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE task_templates DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
