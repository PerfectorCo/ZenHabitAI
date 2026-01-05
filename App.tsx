
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HabitManager from './components/HabitManager';
import PomodoroTimer, { GENERAL_GOALS } from './components/PomodoroTimer';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { Habit, Task, ViewType, UserProfile, FocusSession, TaskTemplate } from './types';
import { StorageService } from './services/storageService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(StorageService.getSession());
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [view, setView] = React.useState<ViewType>('dashboard');
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [taskTemplates, setTaskTemplates] = React.useState<TaskTemplate[]>([]);
  const [focusSessions, setFocusSessions] = React.useState<FocusSession[]>([]);
  const [notifiedRef] = React.useState<{ [key: string]: string }>({});

  // Background check for reminders
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toDateString();

      habits.forEach(habit => {
        if (habit.reminderTime === currentTime && notifiedRef[habit.id] !== todayKey) {
          sendNotification(`Habit Reminder: ${habit.title}`, `Time to keep your ${habit.streak} day streak alive!`);
          notifiedRef[habit.id] = todayKey;
        }
      });

      tasks.forEach(task => {
        if (!task.completed && task.reminderTime === currentTime && notifiedRef[task.id] !== todayKey) {
          sendNotification(`Task Reminder: ${task.title}`, `Don't forget to complete your task today!`);
          notifiedRef[task.id] = todayKey;
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); 
    return () => clearInterval(interval);
  }, [isAuthenticated, habits, tasks]);

  const sendNotification = (title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { 
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
      });
    }
  };

  // Daily Reset Logic
  const checkAndResetDailyTasks = async (currentTasks: Task[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastResetDate = localStorage.getItem('zenhabit_last_reset_date');
    const userId = StorageService.getUserId();

    if (lastResetDate !== todayStr) {
      // It's a new day! Reset recurring tasks
      const updatedTasks = currentTasks.map(task => {
        if (task.isRecurring) {
          return { ...task, completed: false };
        }
        return task;
      });

      setTasks(updatedTasks);
      localStorage.setItem('zenhabit_last_reset_date', todayStr);
      
      for (const t of updatedTasks) {
        if (t.isRecurring) await StorageService.saveTask(userId, t);
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
        const [fetchedProfile, fetchedHabits, fetchedTasks, fetchedSessions] = await Promise.all([
          StorageService.getProfile(userId),
          StorageService.getHabits(userId),
          StorageService.getTasks(userId),
          StorageService.getFocusSessions(userId)
        ]);

        const localTemplates = localStorage.getItem('zenhabit_task_templates');
        const parsedTemplates = localTemplates ? JSON.parse(localTemplates) : [
          { id: 't1', title: 'Check Emails', category: 'Work', isRecurring: true },
          { id: 't2', title: 'Quick Workout', category: 'Health', isRecurring: true },
          { id: 't3', title: 'Reading Time', category: 'Skills', isRecurring: true }
        ];

        setProfile(fetchedProfile);
        setHabits(fetchedHabits);
        setTaskTemplates(parsedTemplates);
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
  }, [isAuthenticated]);

  const handleLogin = (provider: 'google' | 'facebook') => {
    const userId = `${provider}-${Date.now()}`;
    const mockUser: UserProfile = {
      name: provider === 'google' ? 'Google Explorer' : 'Facebook Social',
      email: `${provider}@user.ai`,
      bio: `Authenticated via ${provider}. Ready to build habits.`,
      mainGoal: 'Improve productivity',
      joinedDate: new Date().toISOString()
    };
    
    StorageService.setSession(true, userId);
    setProfile(mockUser);
    StorageService.saveProfile(userId, mockUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    StorageService.clearAll();
    setIsAuthenticated(false);
    setView('dashboard');
    setProfile(null);
    setHabits([]);
    setTasks([]);
    setFocusSessions([]);
  };

  const addHabit = async (title: string, category: string, reminderTime?: string) => {
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
    await StorageService.saveHabit(StorageService.getUserId(), newHabit);
  };

  const toggleHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    let updatedHabitToSave: Habit | null = null;
    
    const updatedHabits = habits.map(h => {
      if (h.id === id) {
        const isCompleted = h.completedDates.includes(today);
        const newDates = isCompleted 
          ? h.completedDates.filter(d => d !== today)
          : [...h.completedDates, today];
        
        updatedHabitToSave = { 
          ...h, 
          completedDates: newDates,
          streak: !isCompleted ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
        return updatedHabitToSave;
      }
      return h;
    });
    
    setHabits(updatedHabits);
    if (updatedHabitToSave) {
      await StorageService.saveHabit(StorageService.getUserId(), updatedHabitToSave);
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    await StorageService.deleteHabit(id);
  };

  const addQuickTask = async (title: string, isRecurring: boolean = false) => {
    const newTask: Task = { 
      id: Date.now().toString(), 
      title, 
      completed: false, 
      completedDates: [],
      timeSpent: 0, 
      createdAt: new Date().toISOString(),
      isRecurring
    };
    setTasks(prev => [newTask, ...prev]);
    await StorageService.saveTask(StorageService.getUserId(), newTask);
  };

  const addTemplateToTasks = async (template: TaskTemplate) => {
    await addQuickTask(template.title, template.isRecurring);
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

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    await StorageService.deleteTask(id);
  };

  const logSessionTime = async (id: string, type: 'habit' | 'task' | 'general' | 'break', minutes: number) => {
    const userId = StorageService.getUserId();
    
    let goalTitle = 'Break Session';
    if (type === 'habit') goalTitle = habits.find(h => h.id === id)?.title || 'Habit';
    else if (type === 'task') goalTitle = tasks.find(t => t.id === id)?.title || 'Task';
    else if (type === 'general') goalTitle = GENERAL_GOALS.find(g => g.id === id)?.title || 'Goal';

    const newSession: FocusSession = {
      id: Date.now().toString(),
      type: type === 'break' ? 'break' : 'focus',
      goalTitle,
      durationMinutes: minutes,
      timestamp: new Date().toISOString()
    };

    setFocusSessions(prev => [newSession, ...prev]);
    await StorageService.saveFocusSession(userId, newSession);

    if (type === 'general') {
      const goal = GENERAL_GOALS.find(g => g.id === id);
      if (goal) {
        const newTask: Task = { 
          id: Date.now().toString(), 
          title: goal.title, 
          completed: false, 
          completedDates: [],
          timeSpent: minutes * 60, 
          createdAt: new Date().toISOString() 
        };
        setTasks(prev => [newTask, ...prev]);
        await StorageService.saveTask(userId, newTask);
      }
      return;
    }

    if (type === 'habit') {
      const updatedHabits = habits.map(h => {
        if (h.id === id) {
          const updatedHabit = { ...h, timeSpentMinutes: h.timeSpentMinutes + minutes };
          StorageService.saveHabit(userId, updatedHabit);
          return updatedHabit;
        }
        return h;
      });
      setHabits(updatedHabits);
    } else if (type === 'task') {
      const updatedTasks = tasks.map(t => {
        if (t.id === id) {
          const updatedTask = { ...t, timeSpent: t.timeSpent + (minutes * 60) };
          StorageService.saveTask(userId, updatedTask);
          return updatedTask;
        }
        return t;
      });
      setTasks(updatedTasks);
    }
  };

  const handleMarkComplete = async (id: string, type: 'habit' | 'task' | 'general') => {
    if (type === 'habit') {
      await toggleHabit(id);
    } else if (type === 'task') {
      await toggleTaskComplete(id);
    } else if (type === 'general') {
      const goal = GENERAL_GOALS.find(g => g.id === id);
      if (goal) {
        const newTask: Task = { 
          id: Date.now().toString(), 
          title: goal.title, 
          completed: true, 
          completedDates: [new Date().toISOString().split('T')[0]],
          timeSpent: 0, 
          createdAt: new Date().toISOString() 
        };
        setTasks(prev => [newTask, ...prev]);
        await StorageService.saveTask(StorageService.getUserId(), newTask);
      }
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await StorageService.saveProfile(StorageService.getUserId(), newProfile);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-200 h-12 w-12 mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Syncing with Cloud Database...</p>
      </div>
    );
  }

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard habits={habits} tasks={tasks} profile={profile} onAddHabit={addHabit} />;
      case 'habits': return <HabitManager 
        habits={habits} 
        tasks={tasks} 
        templates={taskTemplates}
        onAddHabit={addHabit} 
        onToggleHabit={toggleHabit} 
        onAddLevelTask={addQuickTask}
        onAddFromTemplate={addTemplateToTasks}
        onDeleteHabit={deleteHabit}
        onToggleTask={toggleTaskComplete}
        onDeleteTask={deleteTask}
      />;
      case 'pomodoro': return <PomodoroTimer 
        habits={habits} 
        tasks={tasks} 
        sessions={focusSessions}
        onLogTime={logSessionTime} 
        onMarkComplete={handleMarkComplete}
      />;
      case 'analytics': return <Analytics habits={habits} tasks={tasks} sessions={focusSessions} />;
      case 'profile': return <Profile profile={profile} onSave={updateProfile} onLogout={handleLogout} />;
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
