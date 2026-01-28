
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HabitManager from './components/HabitManager';
import PomodoroTimer from './components/PomodoroTimer';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Feedback from './components/Feedback';
import { Habit, Task, ViewType, UserProfile, FocusSession, TaskTemplate } from './types';
import { X, CheckCircle } from 'lucide-react';
import { StorageService } from './services/storageService';
import { useLanguage } from './LanguageContext';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(StorageService.getSession());
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [view, setView] = React.useState<ViewType>('dashboard');
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [taskTemplates, setTaskTemplates] = React.useState<TaskTemplate[]>([]);
  const [focusSessions, setFocusSessions] = React.useState<FocusSession[]>([]);
  const [showMergeToast, setShowMergeToast] = React.useState<boolean>(false);
  const [isConnectingAccount, setIsConnectingAccount] = React.useState<boolean>(false);

  const { t, language } = useLanguage();

  // Handle Supabase auth session
  React.useEffect(() => {
    const initAuth = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (session) {
        const newUserId = session.user.id;
        const previousUserId = StorageService.getUserId();
        if (previousUserId && previousUserId !== newUserId) {
          try {
            await StorageService.mergeGuestIntoUser(previousUserId, newUserId);
          } catch (err) {
            console.error('Initial guest merge failed', err);
          }
        }
        StorageService.setSession(true, newUserId);
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    const { data: listener } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const newUserId = session.user.id;
        const previousUserId = StorageService.getUserId();
        if (previousUserId && previousUserId !== newUserId) {
          try {
            await StorageService.mergeGuestIntoUser(previousUserId, newUserId);
          } catch (err) {
            console.error('Auth state change guest merge failed', err);
          }
        }
        StorageService.setSession(true, newUserId);
        setIsAuthenticated(true);
        setIsConnectingAccount(false);
        // Do not force setView('dashboard') here to respect the current view (e.g., Profile)
      } else if (event === 'SIGNED_OUT') {
        StorageService.clearAll();
        setIsAuthenticated(false);
        setProfile(null);
        setView('dashboard');
      }
    }) || { data: null };

    initAuth();

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (StorageService.consumeMergeSuccessToast()) {
      setShowMergeToast(true);
      const timer = setTimeout(() => setShowMergeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Daily Reset Logic
  const checkAndResetDailyTasks = async (currentTasks: Task[]) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDay = today.getDay();
    const lastResetDate = localStorage.getItem('zenhabit_last_reset_date');
    const userId = StorageService.getUserId();

    if (lastResetDate !== todayStr) {
      const updatedTasks = currentTasks.map(task => {
        if (task.isRecurring && task.repeatDays?.includes(todayDay)) {
          return { ...task, completed: false };
        }
        return task;
      });

      setTasks(updatedTasks);
      localStorage.setItem('zenhabit_last_reset_date', todayStr);
      for (const t of updatedTasks) {
        await StorageService.saveTask(userId, t);
      }
      return updatedTasks;
    }
    return currentTasks;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const userId = StorageService.getUserId();

      try {
        const [fetchedProfile, fetchedHabits, fetchedTasks, fetchedSessions, fetchedCategories, fetchedTemplates] = await Promise.all([
          StorageService.getProfile(userId),
          StorageService.getHabits(userId),
          StorageService.getTasks(userId),
          StorageService.getFocusSessions(userId),
          StorageService.getCategories(userId),
          StorageService.getTaskTemplates(userId)
        ]);

        let templates = fetchedTemplates;
        if (templates.length === 0) {
          templates = [
            { id: `${userId}-t1`, title: language === 'vi' ? 'Kiểm tra Email' : 'Check Emails', category: 'Work', isRecurring: true, repeatDays: [1,2,3,4,5] },
            { id: `${userId}-t2`, title: language === 'vi' ? 'Tập thể dục nhanh' : 'Quick Workout', category: 'Health', isRecurring: true, repeatDays: [1,3,5] },
            { id: `${userId}-t3`, title: language === 'vi' ? 'Thời gian đọc sách' : 'Reading Time', category: 'Skills', isRecurring: true, repeatDays: [0,1,2,3,4,5,6] }
          ];
          for (const t of templates) {
            await StorageService.saveTaskTemplate(userId, t);
          }
        }

        setProfile(fetchedProfile);
        setHabits(fetchedHabits);
        setCategories(fetchedCategories);
        setTaskTemplates(templates);
        setFocusSessions(fetchedSessions);

        // If profile is default or lacks onboarding, switch view to onboarding
        if (!fetchedProfile.onboardingCompleted) {
          setView('onboarding');
        } else {
          const processedTasks = await checkAndResetDailyTasks(fetchedTasks);
          setTasks(processedTasks);
        }
      } catch (error) {
        console.error("Database fetch failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, language]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    StorageService.clearAll();
    setIsAuthenticated(false);
    setView('dashboard');
    setProfile(null);
    setHabits([]);
    setTasks([]);
    setFocusSessions([]);
    setCategories([]);
    setTaskTemplates([]);
  };

  const handleOnboardingComplete = async (onboardingData: Partial<UserProfile>) => {
    const userId = StorageService.getUserId();
    const newProfile: UserProfile = {
      name: onboardingData.name || 'Zen User',
      email: onboardingData.email || '',
      bio: onboardingData.bio || '',
      mainGoal: onboardingData.mainGoal || '',
      customGoalOptions: onboardingData.customGoalOptions || [],
      hiddenStandardGoals: onboardingData.hiddenStandardGoals || [],
      joinedDate: onboardingData.joinedDate || new Date().toISOString(),
      onboardingCompleted: true,
      subscription: 'free' // Default to free plan
    };

    setProfile(newProfile);
    await StorageService.saveProfile(userId, newProfile);
    setView('dashboard');
  };


  const addHabit = async (title: string, category: string, reminderTime?: string) => {
    const userId = StorageService.getUserId();
    const newHabit: Habit = {
      id: Date.now().toString(),
      title,
      category,
      completedDates: [],
      createdAt: new Date().toISOString(),
      targetCount: 1,
      streak: 0,
      timeSpentMinutes: 0,
      reminderTime
    };
    setHabits(prev => [...prev, newHabit]);
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
      await StorageService.saveCategory(userId, category);
    }
    await StorageService.saveHabit(userId, newHabit);
  };

  const addQuickTask = async (title: string, isRecurring: boolean = false, repeatDays?: number[]) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      completedDates: [],
      skippedDates: [],
      repeatDays: isRecurring ? (repeatDays || [0,1,2,3,4,5,6]) : undefined,
      timeSpent: 0,
      createdAt: new Date().toISOString(),
      isRecurring
    };
    setTasks(prev => [newTask, ...prev]);
    await StorageService.saveTask(StorageService.getUserId(), newTask);
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(updatedTasks);
    const task = updatedTasks.find(t => t.id === id);
    if (task) await StorageService.saveTask(StorageService.getUserId(), task);
  };

  const addTemplateToTasks = async (template: TaskTemplate) => {
    await addQuickTask(template.title, template.isRecurring, template.repeatDays);
  };

  const saveTaskAsTemplate = async (task: Task) => {
    const userId = StorageService.getUserId();
    const newTemplate: TaskTemplate = {
      id: `tmpl-${Date.now()}`,
      title: task.title,
      category: 'Saved',
      isRecurring: task.isRecurring || false,
      repeatDays: task.repeatDays
    };
    setTaskTemplates(prev => [...prev, newTemplate]);
    await StorageService.saveTaskTemplate(userId, newTemplate);
  };

  const deleteTemplate = async (templateId: string) => {
    const userId = StorageService.getUserId();
    setTaskTemplates(prev => prev.filter(t => t.id !== templateId));
    await StorageService.deleteTaskTemplate(userId, templateId);
  };

  const toggleTaskComplete = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const isCurrentlyCompleted = !t.completed;
        const currentDates = t.completedDates || [];
        const newDates = isCurrentlyCompleted
          ? Array.from(new Set([...currentDates, todayStr]))
          : currentDates.filter(d => d !== todayStr);
        return { ...t, completed: isCurrentlyCompleted, completedDates: newDates };
      }
      return t;
    });
    setTasks(updatedTasks);
    const task = updatedTasks.find(t => t.id === id);
    if (task) await StorageService.saveTask(StorageService.getUserId(), task);
  };

  const handleSkipTask = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const currentSkipped = t.skippedDates || [];
        const isAlreadySkipped = currentSkipped.includes(todayStr);
        const newSkipped = isAlreadySkipped ? currentSkipped.filter(d => d !== todayStr) : [...currentSkipped, todayStr];
        return { ...t, skippedDates: newSkipped };
      }
      return t;
    });
    setTasks(updatedTasks);
    const task = updatedTasks.find(t => t.id === id);
    if (task) await StorageService.saveTask(StorageService.getUserId(), task);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await StorageService.deleteTask(id);
  };

  const handleLogFocusSession = async (id: string, type: 'habit' | 'task' | 'general' | 'break', minutes: number) => {
    const userId = StorageService.getUserId();

    let goalTitle = '';
    if (type === 'habit') {
      goalTitle = habits.find(h => h.id === id)?.title || 'Habit';
    } else if (type === 'task') {
      goalTitle = tasks.find(t => t.id === id)?.title || 'Task';
    } else if (type === 'general') {
      goalTitle = t(`pomodoro.presets.${id}`);
    } else {
      goalTitle = t('pomodoro.break');
    }

    const newSession: FocusSession = {
      id: Date.now().toString(),
      userId,
      goalTitle,
      type: type === 'break' ? 'break' : 'focus',
      durationMinutes: minutes,
      timestamp: new Date().toISOString()
    };

    setFocusSessions(prev => [newSession, ...prev]);
    await StorageService.saveFocusSession(userId, newSession);
  };

  const handleToggleHabitComplete = async (id: string) => {
    const userId = StorageService.getUserId();
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedHabits = habits.map(h => {
      if (h.id === id) {
        const isCurrentlyCompleted = h.completedDates.includes(todayStr);
        const newDates = isCurrentlyCompleted
          ? h.completedDates.filter(d => d !== todayStr)
          : [...h.completedDates, todayStr];

        return { ...h, completedDates: newDates };
      }
      return h;
    });
    setHabits(updatedHabits);
    const habit = updatedHabits.find(h => h.id === id);
    if (habit) await StorageService.saveHabit(userId, habit);
  };

  const handleDeleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await StorageService.deleteHabit(id);
  };

  const handleMarkGoalComplete = async (id: string, type: 'habit' | 'task' | 'general') => {
    if (type === 'habit') {
      await handleToggleHabitComplete(id);
    } else if (type === 'task') {
      await toggleTaskComplete(id);
    }
    // General goals don't have a 'complete' state in the DB beyond the session log
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={(userId) => {
      StorageService.setSession(true, userId);
      setIsAuthenticated(true);
    }} />;
  }

  if (view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} userEmail={profile?.email || 'newuser@zenhabit.ai'} />;
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-200 h-12 w-12 mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  const isVi = language === 'vi';


  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} />;
      case 'habits': return <HabitManager
        habits={habits}
        tasks={tasks}
        categories={categories}
        templates={taskTemplates}
        profile={profile}
        onAddHabit={addHabit}
        onToggleHabit={handleToggleHabitComplete}
        onAddLevelTask={addQuickTask}
        onUpdateTask={handleUpdateTask}
        onAddFromTemplate={addTemplateToTasks}
        onSaveTemplate={saveTaskAsTemplate}
        onDeleteTemplate={deleteTemplate}
        onDeleteHabit={handleDeleteHabit}
        onToggleTask={toggleTaskComplete}
        onSkipTask={handleSkipTask}
        onDeleteTask={deleteTask}
      />;
      case 'pomodoro': return <PomodoroTimer habits={habits} tasks={tasks} sessions={focusSessions} profile={profile} onLogTime={handleLogFocusSession} onMarkComplete={handleMarkGoalComplete} />;
      case 'analytics': return <Analytics habits={habits} tasks={tasks} sessions={focusSessions} profile={profile} />;
      case 'profile': return <Profile
        profile={profile}
        isGuest={StorageService.getUserId() === 'guest-user'}
        onSave={(p) => setProfile(p)}
        onLogout={handleLogout}
        onConnectAccount={() => setIsConnectingAccount(true)}
      />;
      case 'feedback': return <Feedback />;
      default: return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userProfile={profile}>
      {renderView()}

      {isConnectingAccount && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsConnectingAccount(false)} />
          <div className="relative h-full flex items-center justify-center p-4">
            <div className="max-w-md w-full relative">
              <button
                onClick={() => setIsConnectingAccount(false)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
              >
                <X size={20} />
                {t('common.cancel')}
              </button>
              <Auth
                hideGuest
                minimal
                onLoginSuccess={() => {
                  StorageService.trackEvent('guest_profile_connect_success');
                  setIsConnectingAccount(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showMergeToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl">
            <CheckCircle size={18} className="text-emerald-400" />
            <span className="text-sm font-medium">{t('profile.mergeSuccess')}</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
