
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
import Pricing from './components/Pricing';
import Checkout from './components/Checkout';
import PaymentSuccess from './components/PaymentSuccess';
import { Habit, Task, ViewType, UserProfile, FocusSession, TaskTemplate } from './types';
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
  const [pendingPlan, setPendingPlan] = React.useState<'pro' | 'master' | null>(null);
  const [showMergeScreen, setShowMergeScreen] = React.useState<boolean>(false);

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
          StorageService.mergeGuestIntoUser(previousUserId, newUserId)
            .catch(err => console.error('Deferred guest merge failed', err));
        }
        StorageService.setSession(true, newUserId);
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    };

    const { data: listener } = supabase?.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const newUserId = session.user.id;
        const previousUserId = StorageService.getUserId();
        if (previousUserId && previousUserId !== newUserId) {
          StorageService.mergeGuestIntoUser(previousUserId, newUserId)
            .catch(err => console.error('Deferred guest merge failed', err));
        }
        StorageService.setSession(true, newUserId);
        setIsAuthenticated(true);
        setView('dashboard');
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
    if (StorageService.consumeLoginMergeScreenFlag()) {
      setShowMergeScreen(true);
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
            { id: 't1', title: language === 'vi' ? 'Kiểm tra Email' : 'Check Emails', category: 'Work', isRecurring: true, repeatDays: [1,2,3,4,5] },
            { id: 't2', title: language === 'vi' ? 'Tập thể dục nhanh' : 'Quick Workout', category: 'Health', isRecurring: true, repeatDays: [1,3,5] },
            { id: 't3', title: language === 'vi' ? 'Thời gian đọc sách' : 'Reading Time', category: 'Skills', isRecurring: true, repeatDays: [0,1,2,3,4,5,6] }
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

  const handleLogout = () => {
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

  const handleUpdateSubscription = async (plan: 'free' | 'pro' | 'master') => {
    if (!profile) return;
    if (plan === 'pro' || plan === 'master') {
      setPendingPlan(plan);
      setView('checkout');
      return;
    }
    const userId = StorageService.getUserId();
    const updatedProfile = { ...profile, subscription: plan };
    setProfile(updatedProfile);
    await StorageService.saveProfile(userId, updatedProfile);
  };

  const finalizeSubscription = async () => {
    if (!profile || !pendingPlan) return;
    const userId = StorageService.getUserId();
    const updatedProfile: UserProfile = { ...profile, subscription: pendingPlan };
    setProfile(updatedProfile);
    await StorageService.saveProfile(userId, updatedProfile);
    setPendingPlan(null);
    setView('payment-success'); // Navigate to success screen
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
  const mergeCopy = {
    title: {
      vi: 'Tiếp tục hành trình của bạn',
      en: 'Continue your journey'
    },
    message: {
      vi: 'Tiến trình, thói quen và nhiệm vụ gần đây của bạn đã được lưu vào tài khoản này. Bạn có thể tiếp tục như bình thường.',
      en: 'Your recent progress, habits, and tasks are now saved to this account. You can continue as usual.'
    },
    primaryAction: {
      label: {
        vi: 'Tiếp tục',
        en: 'Continue'
      },
      action: 'continue' as const
    },
    secondaryAction: {
      label: {
        vi: 'Quay lại màn hình trước',
        en: 'Go back to previous screen'
      },
      action: 'go_back' as const
    }
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} onNavigateToPricing={() => setView('pricing')} />;
      case 'habits': return <HabitManager
        habits={habits}
        tasks={tasks}
        categories={categories}
        templates={taskTemplates}
        onAddHabit={addHabit}
        onToggleHabit={(id) => {}}
        onAddLevelTask={addQuickTask}
        onUpdateTask={handleUpdateTask}
        onAddFromTemplate={addTemplateToTasks}
        onSaveTemplate={saveTaskAsTemplate}
        onDeleteTemplate={deleteTemplate}
        onDeleteHabit={(id) => {}}
        onToggleTask={toggleTaskComplete}
        onSkipTask={handleSkipTask}
        onDeleteTask={deleteTask}
      />;
      case 'pomodoro': return <PomodoroTimer habits={habits} tasks={tasks} sessions={focusSessions} onLogTime={() => {}} onMarkComplete={() => {}} />;
      case 'analytics': return <Analytics habits={habits} tasks={tasks} sessions={focusSessions} profile={profile} onNavigateToPricing={() => setView('pricing')} />;
      case 'profile': return <Profile profile={profile} onSave={(p) => setProfile(p)} onLogout={handleLogout} />;
      case 'feedback': return <Feedback />;
      case 'pricing': return <Pricing onSelectPlan={handleUpdateSubscription} currentPlan={profile.subscription} />;
      case 'checkout': return <Checkout
        userEmail={profile.email}
        plan={pendingPlan || 'pro'}
        onConfirm={finalizeSubscription}
        onCancel={() => { setView('pricing'); setPendingPlan(null); }}
        // For testing different payment methods, uncomment and modify:
        // userContext={{
        //   country: 'VN', // 'VN' | 'US' | etc.
        //   language: 'vi', // 'vi' | 'en'
        //   profession: 'dev', // 'dev' | 'knowledge_worker' | 'general_user'
        //   hasInternationalCard: 'true', // 'true' | 'false' | 'unknown'
        //   device: 'desktop' // 'desktop' | 'mobile'
        // }}
      />;
      case 'payment-success': return <PaymentSuccess onContinue={() => setView('dashboard')} />;
      default: return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} onNavigateToPricing={() => setView('pricing')} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userProfile={profile}>
      {renderView()}
      {showMergeScreen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 rounded-3xl bg-white shadow-xl border border-slate-100 p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {isVi ? mergeCopy.title.vi : mergeCopy.title.en}
              </h2>
              <p className="text-sm text-slate-600">
                {isVi ? mergeCopy.message.vi : mergeCopy.message.en}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMergeScreen(false)}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white text-sm font-medium py-2.5 px-4 hover:bg-slate-800 transition-colors"
              >
                {isVi ? mergeCopy.primaryAction.label.vi : mergeCopy.primaryAction.label.en}
              </button>
              <button
                type="button"
                onClick={() => setShowMergeScreen(false)}
                className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-200 text-slate-700 text-sm font-medium py-2.5 px-4 hover:bg-slate-50 transition-colors"
              >
                {isVi ? mergeCopy.secondaryAction.label.vi : mergeCopy.secondaryAction.label.en}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
