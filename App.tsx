
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HabitManager from './components/HabitManager';
import PomodoroTimer from './components/PomodoroTimer';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { Habit, Task, ViewType, UserProfile, FocusSession, TaskTemplate } from './types';
import { StorageService } from './services/storageService';
import { useLanguage } from './LanguageContext';

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
  
  const { t, language } = useLanguage();

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
        
        const processedTasks = await checkAndResetDailyTasks(fetchedTasks);
        setTasks(processedTasks);
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
    return <Auth onLogin={() => {
      StorageService.setSession(true, `user-${Date.now()}`);
      setIsAuthenticated(true);
    }} />;
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-200 h-12 w-12 mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} />;
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
      case 'analytics': return <Analytics habits={habits} tasks={tasks} sessions={focusSessions} />;
      case 'profile': return <Profile profile={profile} onSave={() => {}} onLogout={handleLogout} />;
      default: return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView} userProfile={profile}>
      {renderView()}
    </Layout>
  );
};

export default App;
