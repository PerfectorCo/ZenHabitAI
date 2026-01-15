
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Habit, Task, UserProfile, FocusSession, Category, TaskTemplate, FeedbackSubmission, StoredAIRecommendations, StoredAIInsights } from '../types';

// Retrieve keys from process.env
const SUPABASE_URL = (process.env as any).SUPABASE_URL;
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY;

// Only initialize if keys are present to avoid "supabaseUrl is required" error
let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
}

// Helper functions to convert between camelCase (TypeScript) and snake_case (SQL)
const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const camelToSnake = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
};

const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const snakeToCamelObj = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamelObj);
  if (typeof obj !== 'object') return obj;

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = snakeToCamelObj(value);
  }
  return result;
};

const STORAGE_KEYS = {
  SESSION: 'zenhabit_db_session',
  USER_ID: 'zenhabit_db_user_id',
  HABITS: 'zenhabit_db_habits',
  TASKS: 'zenhabit_db_tasks',
  TEMPLATES: 'zenhabit_db_templates',
  PROFILE: 'zenhabit_db_profile',
  FOCUS_SESSIONS: 'zenhabit_db_focus_sessions',
  CATEGORIES: 'zenhabit_db_categories',
  FEEDBACK: 'zenhabit_db_feedback',
  AI_RECS: 'zenhabit_db_ai_recs',
  AI_INSIGHTS: 'zenhabit_db_ai_insights'
};

const LOGIN_SUGGESTION_SESSION_KEY_PREFIX = 'zenhabit_login_suggestion_';
const LOGIN_MERGE_DONE_PREFIX = 'zenhabit_login_merged_';
const LOGIN_MERGE_SCREEN_FLAG_KEY = 'zenhabit_login_merge_screen';
const LOGIN_MERGE_SUCCESS_TOAST_KEY = 'zenhabit_login_merge_success_toast';

const getPlatformFromUserAgent = (): 'desktop' | 'mobile' => {
  if (typeof navigator === 'undefined') return 'desktop';
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? 'mobile' : 'desktop';
};

const unionById = <T extends { id: string }>(...lists: T[][]): T[] => {
  const map = new Map<string, T>();
  for (const list of lists) {
    for (const item of list) {
      if (!item || !item.id) continue;
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
};

export const StorageService = {
  // Tracking
  trackEvent: (eventName: string, properties?: any) => {
    // In a real app, this would send to PostHog, Mixpanel, etc.
    // For now, we'll just log it.
    console.log(`[Analytics] ${eventName}`, properties);
  },

  // Auth Operations
  getSession: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
  },

  setSession: (status: boolean, userId: string = 'guest-user') => {
    localStorage.setItem(STORAGE_KEYS.SESSION, String(status));
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  },

  getUserId: () => localStorage.getItem(STORAGE_KEYS.USER_ID) || 'guest-user',

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // Category Operations
  getCategories: async (userId: string): Promise<string[]> => {
    if (supabase && userId !== 'guest-user') {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .eq('user_id', userId);
        if (!error && data) return data.map(c => c.name);
      } catch (e) {
        console.warn("Supabase categories fetch failed", e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return local ? JSON.parse(local) : ['Health', 'Mindset', 'Work', 'Skills'];
  },

  saveCategory: async (userId: string, categoryName: string) => {
    const current = await StorageService.getCategories(userId);
    if (!current.includes(categoryName)) {
      const updated = [...current, categoryName];
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));

      if (supabase && userId !== 'guest-user') {
        try {
          await supabase.from('categories').upsert({
            id: `${userId}-${categoryName}`,
            user_id: userId,
            name: categoryName
          });
        } catch (e) {
          console.error("Supabase category save failed", e);
        }
      }
    }
  },

  // Profile Operations
  getProfile: async (userId: string): Promise<UserProfile> => {
    if (supabase && userId !== 'guest-user') {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) {
          // Convert snake_case to camelCase
          return snakeToCamelObj(data) as UserProfile;
        }
      } catch (e) {
        console.warn("Supabase profile fetch failed, using local storage", e);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed.mainGoals)) {
        parsed.mainGoal = parsed.mainGoals.length > 0 ? parsed.mainGoals[0] : '';
        delete parsed.mainGoals;
      }
      if (!parsed.customGoalOptions) parsed.customGoalOptions = [];
      if (!parsed.hiddenStandardGoals) parsed.hiddenStandardGoals = [];
      if (!parsed.subscription) parsed.subscription = 'free'; // Migration
      return parsed;
    }

    return {
      name: 'Zen User',
      email: 'user@zenhabit.ai',
      bio: '',
      mainGoal: '',
      customGoalOptions: [],
      hiddenStandardGoals: [],
      joinedDate: new Date().toISOString(),
      onboardingCompleted: false,
      subscription: 'free'
    };
  },

  saveProfile: async (userId: string, profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    if (supabase && userId !== 'guest-user') {
      try {
        // Convert camelCase to snake_case for Supabase
        const dbProfile = camelToSnake({ id: userId, ...profile });
        await supabase.from('profiles').upsert(dbProfile);
      } catch (e) {
        console.error("Supabase profile save failed", e);
      }
    }
  },

  // Habit Operations
  getHabits: async (userId: string): Promise<Habit[]> => {
    if (supabase && userId !== 'guest-user') {
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) {
          // Convert snake_case to camelCase
          return data.map(snakeToCamelObj) as Habit[];
        }
      } catch (e) {
        console.warn("Supabase habits fetch failed", e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.HABITS);
    return local ? JSON.parse(local) : [];
  },

  saveHabit: async (userId: string, habit: Habit) => {
    const localHabits = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
    const index = localHabits.findIndex((h: Habit) => h.id === habit.id);
    if (index > -1) localHabits[index] = habit;
    else localHabits.push(habit);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(localHabits));

    if (supabase && userId !== 'guest-user') {
      try {
        // Convert camelCase to snake_case for Supabase
        const dbHabit = camelToSnake({ user_id: userId, ...habit });
        await supabase.from('habits').upsert(dbHabit);
      } catch (e) {
        console.error("Supabase habit save failed", e);
      }
    }
  },

  deleteHabit: async (habitId: string) => {
    const localHabits = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(localHabits.filter((h: Habit) => h.id !== habitId)));
    const userId = StorageService.getUserId();
    if (supabase && userId !== 'guest-user') {
      try {
        await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
      } catch (e) {
        console.error("Supabase habit deletion failed", e);
      }
    }
  },

  // Task Operations
  getTasks: async (userId: string): Promise<Task[]> => {
    if (supabase && userId !== 'guest-user') {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) {
          // Convert snake_case to camelCase
          return data.map(snakeToCamelObj) as Task[];
        }
      } catch (e) {
        console.warn("Supabase tasks fetch failed", e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.TASKS);
    return local ? JSON.parse(local) : [];
  },

  saveTask: async (userId: string, task: Task) => {
    const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const index = localTasks.findIndex((t: Task) => t.id === task.id);
    if (index > -1) localTasks[index] = task;
    else localTasks.push(task);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(localTasks));

    if (supabase && userId !== 'guest-user') {
      try {
        // Convert camelCase to snake_case for Supabase
        const dbTask = camelToSnake({ user_id: userId, ...task });
        await supabase.from('tasks').upsert(dbTask);
      } catch (e) {
        console.error("Supabase task save failed", e);
      }
    }
  },

  deleteTask: async (taskId: string) => {
    const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(localTasks.filter((t: Task) => t.id !== taskId)));
    const userId = StorageService.getUserId();
    if (supabase && userId !== 'guest-user') {
      try {
        await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
      } catch (e) {
        console.error("Supabase task deletion failed", e);
      }
    }
  },

  // Template Operations
  getTaskTemplates: async (userId: string): Promise<TaskTemplate[]> => {
    if (supabase && userId !== 'guest-user') {
      try {
        const { data, error } = await supabase.from('task_templates').select('*').eq('user_id', userId);
        if (!error && data) {
          // Convert snake_case to camelCase
          return data.map(snakeToCamelObj) as TaskTemplate[];
        }
      } catch (e) {
        console.warn("Supabase templates fetch failed", e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return local ? JSON.parse(local) : [];
  },

  saveTaskTemplate: async (userId: string, template: TaskTemplate) => {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
    const index = local.findIndex((t: TaskTemplate) => t.id === template.id);
    if (index > -1) local[index] = template;
    else local.push(template);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(local));
    if (supabase && userId !== 'guest-user') {
      try {
        // Convert camelCase to snake_case for Supabase
        const dbTemplate = camelToSnake({ user_id: userId, ...template });
        await supabase.from('task_templates').upsert(dbTemplate);
      } catch (e) {
        console.error("Supabase template save failed", e);
      }
    }
  },

  deleteTaskTemplate: async (userId: string, templateId: string) => {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(local.filter((t: TaskTemplate) => t.id !== templateId)));
    if (supabase && userId !== 'guest-user') {
      try {
        await supabase.from('task_templates').delete().eq('id', templateId).eq('user_id', userId);
      } catch (e) {
        console.error("Supabase template deletion failed", e);
      }
    }
  },

  // Focus Session Operations
  getFocusSessions: async (userId: string): Promise<FocusSession[]> => {
    if (supabase && userId !== 'guest-user') {
      try {
        const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
        if (!error && data) {
          // Convert snake_case to camelCase
          return data.map(snakeToCamelObj) as FocusSession[];
        }
      } catch (e) {
        console.warn("Supabase focus sessions fetch failed", e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    return local ? JSON.parse(local) : [];
  },

  saveFocusSession: async (userId: string, session: FocusSession) => {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS) || '[]');
    local.unshift(session);
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(local));
    if (supabase && userId !== 'guest-user') {
      try {
        // Convert camelCase to snake_case for Supabase
        const dbSession = camelToSnake({ user_id: userId, ...session });
        await supabase.from('focus_sessions').upsert(dbSession);
      } catch (e) {
        console.error("Supabase focus session save failed", e);
      }
    }
  },

  // Feedback
  saveFeedback: async (feedback: FeedbackSubmission) => {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACK) || '[]');
    local.push(feedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(local));
    if (supabase && StorageService.getUserId() !== 'guest-user') {
      try {
        // Convert camelCase to snake_case for Supabase
        const dbFeedback = camelToSnake(feedback);
        await supabase.from('feedback').insert(dbFeedback);
      } catch (e) {
        console.error("Supabase feedback save failed", e);
      }
    }
  },

  // AI Cache Methods
  getStoredAIRecommendations: (): StoredAIRecommendations | null => {
    const local = localStorage.getItem(STORAGE_KEYS.AI_RECS);
    return local ? JSON.parse(local) : null;
  },

  saveAIRecommendations: (data: StoredAIRecommendations) => {
    localStorage.setItem(STORAGE_KEYS.AI_RECS, JSON.stringify(data));
  },

  getStoredAIInsights: (): StoredAIInsights[] => {
    const local = localStorage.getItem(STORAGE_KEYS.AI_INSIGHTS);
    return local ? JSON.parse(local) : [];
  },

  saveAIInsight: (insight: StoredAIInsights) => {
    const current = StorageService.getStoredAIInsights();
    const updated = current.filter(i => i.period !== insight.period);
    updated.push(insight);
    localStorage.setItem(STORAGE_KEYS.AI_INSIGHTS, JSON.stringify(updated));
  },

  // Login suggestion decision cached per (language, platform) and browser session
  getLoginSuggestionDecision: (language: string, platform?: 'desktop' | 'mobile'): boolean => {
    const resolvedPlatform = platform || getPlatformFromUserAgent();
    const key = `${LOGIN_SUGGESTION_SESSION_KEY_PREFIX}${language}_${resolvedPlatform}`;

    try {
      const cached = sessionStorage.getItem(key);
      if (cached !== null) return cached === 'true';
    } catch {
      // Ignore sessionStorage access issues and fall back to default
    }

    // For now, always suggest login once per (language, platform, session)
    const decision = true;

    try {
      sessionStorage.setItem(key, String(decision));
    } catch {
      // Ignore sessionStorage write failures
    }

    return decision;
  },

  // One-time guest → account merge, safe to retry and invisible to the user
  mergeGuestIntoUser: async (guestUserId: string, authenticatedUserId: string): Promise<void> => {
    if (!authenticatedUserId || guestUserId === authenticatedUserId) return;

    const mergeDoneKey = `${LOGIN_MERGE_DONE_PREFIX}${authenticatedUserId}`;
    if (localStorage.getItem(mergeDoneKey) === 'true') return;

    // Detect if there is any local guest data worth merging
    const localHabits: Habit[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
    const localTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    const localSessions: FocusSession[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS) || '[]');
    const localTemplates: TaskTemplate[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
    const localProfileRaw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const localProfile: UserProfile | null = localProfileRaw ? JSON.parse(localProfileRaw) : null;

    const hasLocalData =
      localHabits.length > 0 ||
      localTasks.length > 0 ||
      localSessions.length > 0 ||
      localTemplates.length > 0 ||
      !!localProfile;

    if (!supabase) {
      if (hasLocalData) {
        try {
          sessionStorage.setItem(LOGIN_MERGE_SCREEN_FLAG_KEY, 'true');
        } catch {
          // Ignore sessionStorage errors
        }
      }
      localStorage.setItem(mergeDoneKey, 'true');
      return;
    }

    let mergedSomething = false;

    try {
      // Habits
      const [remoteHabitsRes, guestHabitsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', authenticatedUserId),
        supabase.from('habits').select('*').eq('user_id', guestUserId)
      ]);
      const remoteHabits: Habit[] = (remoteHabitsRes.data || []).map(snakeToCamelObj) as Habit[];
      const guestHabitsRemote: Habit[] = (guestHabitsRes.data || []).map(snakeToCamelObj) as Habit[];
      const mergedHabits = unionById<Habit>(remoteHabits, guestHabitsRemote, localHabits);
      if (mergedHabits.length > 0) {
        mergedSomething = true;
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(mergedHabits));
        const dbHabits = mergedHabits.map(h => camelToSnake({ user_id: authenticatedUserId, ...h }));
        await supabase.from('habits').upsert(dbHabits);
        if (guestHabitsRes.data && guestHabitsRes.data.length > 0) {
          await supabase.from('habits').delete().eq('user_id', guestUserId);
        }
      }

      // Tasks
      const [remoteTasksRes, guestTasksRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', authenticatedUserId),
        supabase.from('tasks').select('*').eq('user_id', guestUserId)
      ]);
      const remoteTasks: Task[] = (remoteTasksRes.data || []).map(snakeToCamelObj) as Task[];
      const guestTasksRemote: Task[] = (guestTasksRes.data || []).map(snakeToCamelObj) as Task[];
      const mergedTasks = unionById<Task>(remoteTasks, guestTasksRemote, localTasks);
      if (mergedTasks.length > 0) {
        mergedSomething = true;
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mergedTasks));
        const dbTasks = mergedTasks.map(t => camelToSnake({ user_id: authenticatedUserId, ...t }));
        await supabase.from('tasks').upsert(dbTasks);
        if (guestTasksRes.data && guestTasksRes.data.length > 0) {
          await supabase.from('tasks').delete().eq('user_id', guestUserId);
        }
      }

      // Focus sessions
      const [remoteSessionsRes, guestSessionsRes] = await Promise.all([
        supabase.from('focus_sessions').select('*').eq('user_id', authenticatedUserId),
        supabase.from('focus_sessions').select('*').eq('user_id', guestUserId)
      ]);
      const remoteSessions: FocusSession[] = (remoteSessionsRes.data || []).map(snakeToCamelObj) as FocusSession[];
      const guestSessionsRemote: FocusSession[] = (guestSessionsRes.data || []).map(snakeToCamelObj) as FocusSession[];
      const mergedSessions = unionById<FocusSession>(remoteSessions, guestSessionsRemote, localSessions);
      if (mergedSessions.length > 0) {
        mergedSomething = true;
        localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(mergedSessions));
        const dbSessions = mergedSessions.map(s => camelToSnake({ user_id: authenticatedUserId, ...s }));
        await supabase.from('focus_sessions').upsert(dbSessions);
        if (guestSessionsRes.data && guestSessionsRes.data.length > 0) {
          await supabase.from('focus_sessions').delete().eq('user_id', guestUserId);
        }
      }

      // Task templates
      const [remoteTemplatesRes, guestTemplatesRes] = await Promise.all([
        supabase.from('task_templates').select('*').eq('user_id', authenticatedUserId),
        supabase.from('task_templates').select('*').eq('user_id', guestUserId)
      ]);
      const remoteTemplates: TaskTemplate[] = (remoteTemplatesRes.data || []).map(snakeToCamelObj) as TaskTemplate[];
      const guestTemplatesRemote: TaskTemplate[] = (guestTemplatesRes.data || []).map(snakeToCamelObj) as TaskTemplate[];
      const mergedTemplates = unionById<TaskTemplate>(remoteTemplates, guestTemplatesRemote, localTemplates);
      if (mergedTemplates.length > 0) {
        mergedSomething = true;
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(mergedTemplates));
        const dbTemplates = mergedTemplates.map(t => camelToSnake({ user_id: authenticatedUserId, ...t }));
        await supabase.from('task_templates').upsert(dbTemplates);
        if (guestTemplatesRes.data && guestTemplatesRes.data.length > 0) {
          await supabase.from('task_templates').delete().eq('user_id', guestUserId);
        }
      }

      // Profile (guest profile takes priority over empty/new account data)
      const [remoteProfileRes, guestProfileRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authenticatedUserId).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', guestUserId).maybeSingle()
      ]);

      const remoteProfile: UserProfile | null = remoteProfileRes.data
        ? (snakeToCamelObj(remoteProfileRes.data) as UserProfile)
        : null;
      const guestProfileRemote: UserProfile | null = guestProfileRes.data
        ? (snakeToCamelObj(guestProfileRes.data) as UserProfile)
        : null;

      let mergedProfile: UserProfile | null = null;
      if (remoteProfile) mergedProfile = { ...remoteProfile };
      if (guestProfileRemote) mergedProfile = { ...(mergedProfile || {} as UserProfile), ...guestProfileRemote };
      if (localProfile) mergedProfile = { ...(mergedProfile || {} as UserProfile), ...localProfile };

      if (mergedProfile) {
        mergedSomething = true;
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(mergedProfile));
        const dbProfile = camelToSnake({ id: authenticatedUserId, ...mergedProfile });
        await supabase.from('profiles').upsert(dbProfile);
        if (guestProfileRes.data) {
          await supabase.from('profiles').delete().eq('id', guestUserId);
        }
      }

      // Final step: Sync profile from auth metadata for potential missing fields (email, avatar, name)
      // This is safe even if guest profile had data, as sync_profile_from_auth only fills missing/generic fields.
      await supabase.rpc('sync_profile_from_auth', { user_uuid: authenticatedUserId });

      localStorage.setItem(mergeDoneKey, 'true');
      if (mergedSomething) {
        try {
          sessionStorage.setItem(LOGIN_MERGE_SUCCESS_TOAST_KEY, 'true');
        } catch {
          // Ignore sessionStorage errors
        }
      }

    } catch (error) {
      console.error('Guest to account merge failed', error);
      // Do not mark merge as done so that a future login can retry
    }
  },

  consumeLoginMergeScreenFlag: (): boolean => {
    try {
      const value = sessionStorage.getItem(LOGIN_MERGE_SCREEN_FLAG_KEY);
      if (value === 'true') {
        sessionStorage.removeItem(LOGIN_MERGE_SCREEN_FLAG_KEY);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  consumeMergeSuccessToast: (): boolean => {
    try {
      const value = sessionStorage.getItem(LOGIN_MERGE_SUCCESS_TOAST_KEY);
      if (value === 'true') {
        sessionStorage.removeItem(LOGIN_MERGE_SUCCESS_TOAST_KEY);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};
