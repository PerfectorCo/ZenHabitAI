# Supabase Setup Verification

## ✅ Current Setup Status

### 1. Package Installation
- ✅ `@supabase/supabase-js` installed (v2.45.0)
- ✅ Listed in `package.json` dependencies

### 2. Configuration Files

#### `vite.config.ts`
```typescript
define: {
  'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
}
```
✅ **Correct** - Environment variables are properly exposed

#### `services/storageService.ts`
```typescript
const SUPABASE_URL = (process.env as any).SUPABASE_URL;
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
}
```
✅ **Correct** - Safely initializes Supabase only if keys are present
✅ **Correct** - Falls back to localStorage if Supabase is not configured

### 3. Environment Variables

**Required in `.env.local`:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Status:** ⚠️ **Optional** - App works without them (uses localStorage)

---

## ✅ Setup is Correct!

The Supabase configuration is properly set up:

1. ✅ Package installed
2. ✅ Environment variables configured in `vite.config.ts`
3. ✅ StorageService reads from `process.env`
4. ✅ Graceful fallback to localStorage
5. ✅ Error handling in place

---

## How to Verify It's Working

### Test 1: Check if Supabase is Initialized

Add this to your browser console:
```javascript
// Check if Supabase client exists
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
```

### Test 2: Check StorageService

The app will automatically:
- Use Supabase if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Fall back to localStorage if they're not set

### Test 3: Verify Database Operations

If Supabase is configured, check browser console for:
- ✅ No "Supabase fetch failed" warnings = Supabase is working
- ⚠️ "Supabase fetch failed" warnings = Using localStorage fallback

---

## Database Tables Required

If you want to use Supabase, create these tables:

### Complete SQL Script (Copy & Paste into Supabase SQL Editor)

```sql
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
```

**Note:**
- The policies above use `USING (true)` which allows all operations.
- If you're using Supabase Auth, replace `true` with `auth.uid()::text = user_id` (or `id` for profiles table).
- If you're using custom authentication, you may want to disable RLS entirely (see commented section at the bottom).

---

## Summary

✅ **Supabase setup is correct!**

The configuration is properly done:
- Environment variables are exposed via Vite's `define`
- StorageService safely initializes Supabase
- Graceful fallback to localStorage
- Error handling in place

**Next steps:**
1. Create `.env.local` with your Supabase credentials (optional)
2. Create database tables (if using Supabase)
3. Configure RLS policies (if using Supabase Auth)
4. Restart dev server after adding environment variables

The app will work with or without Supabase - it automatically falls back to localStorage if Supabase is not configured.
