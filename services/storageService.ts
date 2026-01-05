
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

export const StorageService = {
  // Auth Operations
  getSession: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
  },

  setSession: (status: boolean, userId: string = 'mock-user-123') => {
    localStorage.setItem(STORAGE_KEYS.SESSION, String(status));
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  },

  getUserId: () => localStorage.getItem(STORAGE_KEYS.USER_ID) || 'mock-user-123',

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // Category Operations
  getCategories: async (userId: string): Promise<string[]> => {
    if (supabase) {
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
      
      if (supabase) {
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) return data;
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
      onboardingCompleted: false
    };
  },

  saveProfile: async (userId: string, profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({ id: userId, ...profile });
      } catch (e) {
        console.error("Supabase profile save failed", e);
      }
    }
  },

  // Habit Operations
  getHabits: async (userId: string): Promise<Habit[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) return data;
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

    if (supabase) {
      try {
        await supabase.from('habits').upsert({ user_id: userId, ...habit });
      } catch (e) {
        console.error("Supabase habit save failed", e);
      }
    }
  },

  deleteHabit: async (habitId: string) => {
    const localHabits = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(localHabits.filter((h: Habit) => h.id !== habitId)));
    if (supabase) {
      try {
        await supabase.from('habits').delete().eq('id', habitId);
      } catch (e) {
        console.error("Supabase habit deletion failed", e);
      }
    }
  },

  // Task Operations
  getTasks: async (userId: string): Promise<Task[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) return data;
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

    if (supabase) {
      try {
        await supabase.from('tasks').upsert({ user_id: userId, ...task });
      } catch (e) {
        console.error("Supabase task save failed", e);
      }
    }
  },

  deleteTask: async (taskId: string) => {
    const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(localTasks.filter((t: Task) => t.id !== taskId)));
    if (supabase) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
      } catch (e) {
        console.error("Supabase task deletion failed", e);
      }
    }
  },

  // Template Operations
  getTaskTemplates: async (userId: string): Promise<TaskTemplate[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('task_templates').select('*').eq('user_id', userId);
        if (!error && data) return data;
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
    if (supabase) {
      try {
        await supabase.from('task_templates').upsert({ user_id: userId, ...template });
      } catch (e) {
        console.error("Supabase template save failed", e);
      }
    }
  },

  deleteTaskTemplate: async (userId: string, templateId: string) => {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]');
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(local.filter((t: TaskTemplate) => t.id !== templateId)));
    if (supabase) {
      try {
        await supabase.from('task_templates').delete().eq('id', templateId).eq('user_id', userId);
      } catch (e) {
        console.error("Supabase template deletion failed", e);
      }
    }
  },

  // Focus Session Operations
  getFocusSessions: async (userId: string): Promise<FocusSession[]> => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('focus_sessions').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
        if (!error && data) return data;
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
    if (supabase) {
      try {
        await supabase.from('focus_sessions').upsert({ user_id: userId, ...session });
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
    if (supabase) {
      try { await supabase.from('feedback').insert(feedback); } catch (e) { console.error("Supabase feedback save failed", e); }
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
  }
};
