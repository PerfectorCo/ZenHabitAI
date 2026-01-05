
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HabitManager from './components/HabitManager';
import PomodoroTimer, { GENERAL_GOALS } from './components/PomodoroTimer';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { Habit, Task, ViewType, UserProfile, FocusSession } from './types';
import { StorageService } from './services/storageService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(StorageService.getSession());
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [view, setView] = React.useState<ViewType>('dashboard');
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = React.useState<FocusSession[]>([]);

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

        setProfile(fetchedProfile);
        setHabits(fetchedHabits);
        setTasks(fetchedTasks);
        setFocusSessions(fetchedSessions);
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

  const addHabit = async (title: string, category: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title,
      category,
      completedDates: [],
      createdAt: new Date().toISOString(),
      targetCount: 1,
      streak: 0,
      timeSpentMinutes: 0
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

  const addQuickTask = async (title: string) => {
    const newTask: Task = { 
      id: Date.now().toString(), 
      title, 
      completed: false, 
      timeSpent: 0, 
      createdAt: new Date().toISOString() 
    };
    setTasks(prev => [newTask, ...prev]);
    await StorageService.saveTask(StorageService.getUserId(), newTask);
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
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: true } : t);
      setTasks(updatedTasks);
      const task = updatedTasks.find(t => t.id === id);
      if (task) await StorageService.saveTask(StorageService.getUserId(), task);
    } else if (type === 'general') {
      const goal = GENERAL_GOALS.find(g => g.id === id);
      if (goal) {
        const newTask: Task = { 
          id: Date.now().toString(), 
          title: goal.title, 
          completed: true, 
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
        onAddHabit={addHabit} 
        onToggleHabit={toggleHabit} 
        onAddLevelTask={addQuickTask}
        onDeleteHabit={deleteHabit}
      />;
      case 'pomodoro': return <PomodoroTimer 
        habits={habits} 
        tasks={tasks} 
        sessions={focusSessions}
        onLogTime={logSessionTime} 
        onMarkComplete={handleMarkComplete}
      />;
      case 'analytics': return <Analytics habits={habits} />;
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
