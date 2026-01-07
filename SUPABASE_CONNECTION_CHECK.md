# Supabase Connection Verification

## ✅ Column Name Mapping Fixed

The app now automatically converts between:
- **TypeScript (camelCase)**: `completedDates`, `createdAt`, `reminderTime`
- **SQL (snake_case)**: `completed_dates`, `created_at`, `reminder_time`

### Conversion Functions Added

- `camelToSnake()` - Converts camelCase objects to snake_case for database writes
- `snakeToCamelObj()` - Converts snake_case objects to camelCase for TypeScript reads

## Table Mapping Verification

| Table | Code Reference | SQL Table | Status |
|-------|---------------|-----------|--------|
| Profiles | `profiles` | `profiles` | ✅ Match |
| Habits | `habits` | `habits` | ✅ Match |
| Tasks | `tasks` | `tasks` | ✅ Match |
| Task Templates | `task_templates` | `task_templates` | ✅ Match |
| Focus Sessions | `focus_sessions` | `focus_sessions` | ✅ Match |
| Categories | `categories` | `categories` | ✅ Match |
| Feedback | `feedback` | `feedback` | ✅ Match |

## Column Mapping Verification

### Profiles Table
| TypeScript | SQL | Status |
|------------|-----|--------|
| `id` | `id` | ✅ Match |
| `name` | `name` | ✅ Match |
| `email` | `email` | ✅ Match |
| `bio` | `bio` | ✅ Match |
| `mainGoal` | `main_goal` | ✅ Auto-converted |
| `customGoalOptions` | `custom_goal_options` | ✅ Auto-converted |
| `hiddenStandardGoals` | `hidden_standard_goals` | ✅ Auto-converted |
| `avatarUrl` | `avatar_url` | ✅ Auto-converted |
| `joinedDate` | `joined_date` | ✅ Auto-converted |
| `onboardingCompleted` | `onboarding_completed` | ✅ Auto-converted |
| `subscription` | `subscription` | ✅ Match |

### Habits Table
| TypeScript | SQL | Status |
|------------|-----|--------|
| `id` | `id` | ✅ Match |
| `user_id` | `user_id` | ✅ Match |
| `title` | `title` | ✅ Match |
| `category` | `category` | ✅ Match |
| `completedDates` | `completed_dates` | ✅ Auto-converted |
| `createdAt` | `created_at` | ✅ Auto-converted |
| `targetCount` | `target_count` | ✅ Auto-converted |
| `streak` | `streak` | ✅ Match |
| `timeSpentMinutes` | `time_spent_minutes` | ✅ Auto-converted |
| `reminderTime` | `reminder_time` | ✅ Auto-converted |

### Tasks Table
| TypeScript | SQL | Status |
|------------|-----|--------|
| `id` | `id` | ✅ Match |
| `user_id` | `user_id` | ✅ Match |
| `title` | `title` | ✅ Match |
| `completed` | `completed` | ✅ Match |
| `completedDates` | `completed_dates` | ✅ Auto-converted |
| `skippedDates` | `skipped_dates` | ✅ Auto-converted |
| `repeatDays` | `repeat_days` | ✅ Auto-converted |
| `timeSpent` | `time_spent` | ✅ Auto-converted |
| `createdAt` | `created_at` | ✅ Auto-converted |
| `reminderTime` | `reminder_time` | ✅ Auto-converted |
| `isRecurring` | `is_recurring` | ✅ Auto-converted |

### Focus Sessions Table
| TypeScript | SQL | Status |
|------------|-----|--------|
| `id` | `id` | ✅ Match |
| `user_id` | `user_id` | ✅ Match |
| `type` | `type` | ✅ Match |
| `goalTitle` | `goal_title` | ✅ Auto-converted |
| `durationMinutes` | `duration_minutes` | ✅ Auto-converted |
| `timestamp` | `timestamp` | ✅ Match |

## How to Test Connection

### 1. Check Environment Variables

In browser console:
```javascript
console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
```

### 2. Test Database Operations

The app will automatically:
- Try Supabase first (if configured)
- Fall back to localStorage if Supabase fails or is not configured

### 3. Check Browser Console

Look for:
- ✅ **No errors** = Connection successful
- ⚠️ **"Supabase fetch failed"** warnings = Using localStorage fallback
- ❌ **"Failed to initialize Supabase client"** = Check environment variables

### 4. Verify Data Persistence

1. Create a habit/task in the app
2. Check Supabase Dashboard → Table Editor
3. Verify data appears in the correct table

## Common Issues

### Issue: "relation does not exist"
**Solution**: Run the SQL script in `supabase-setup.sql`

### Issue: "permission denied"
**Solution**: Check RLS policies - they're currently set to `USING (true)` which allows all operations

### Issue: Column name mismatch
**Solution**: ✅ Already fixed - conversion functions handle this automatically

### Issue: Data not saving
**Solution**:
1. Check browser console for errors
2. Verify environment variables are set
3. Check Supabase Dashboard → Logs for API errors

## Connection Status Checklist

- [ ] Environment variables set in `.env.local`
- [ ] SQL tables created in Supabase
- [ ] RLS policies configured (or disabled)
- [ ] Dev server restarted after adding env vars
- [ ] Browser console shows no Supabase errors
- [ ] Data appears in Supabase tables when created in app

## Next Steps

1. **Set up environment variables**:
   ```bash
   # .env.local
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. **Run SQL script**:
   - Copy `supabase-setup.sql` into Supabase SQL Editor
   - Execute the script

3. **Test connection**:
   - Restart dev server: `npm run dev`
   - Create a habit/task in the app
   - Check Supabase Dashboard to verify data appears

4. **Monitor logs**:
   - Browser console for client-side errors
   - Supabase Dashboard → Logs for API errors

---

✅ **Connection setup is complete!** The app will automatically use Supabase when credentials are provided, or fall back to localStorage if not configured.
