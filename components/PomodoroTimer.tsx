
import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Bell, CheckCircle2, PlusCircle, Settings2, AlertCircle, CheckCircle, TimerReset, Zap, History, Clock } from 'lucide-react';
import { Habit, Task, FocusSession, UserProfile } from '../types';

import { useLanguage } from '../LanguageContext';
import { StorageService } from '../services/storageService';

export const GENERAL_GOALS = [
  { id: 'reading', category: 'Learning' },
  { id: 'learning', category: 'Skills' },
  { id: 'meditation', category: 'Mindset' },
  { id: 'exercise', category: 'Health' }
];

interface PomodoroTimerProps {
  habits: Habit[];
  tasks: Task[];
  sessions: FocusSession[];
  profile: UserProfile;
  onLogTime: (id: string, type: 'habit' | 'task' | 'general' | 'break', minutes: number) => void;
  onMarkComplete: (id: string, type: 'habit' | 'task' | 'general') => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ habits, tasks, sessions, profile, onLogTime, onMarkComplete }) => {
  const [focusDuration, setFocusDuration] = React.useState(25);
  const [breakDuration, setBreakDuration] = React.useState(5);
  const [autoStartBreak, setAutoStartBreak] = React.useState(false);
  const { t } = useLanguage();

  const [minutes, setMinutes] = React.useState(25);
  const [seconds, setSeconds] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const [mode, setMode] = React.useState<'focus' | 'break'>('focus');
  const [selectedItem, setSelectedItem] = React.useState<{ id: string, type: 'habit' | 'task' | 'general' } | null>(null);
  const [showLoggedPulse, setShowLoggedPulse] = React.useState(false);
  const [showErrorPulse, setShowErrorPulse] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showPostSession, setShowPostSession] = React.useState(false);
  const [historyTab, setHistoryTab] = React.useState<'today' | 'week' | 'month'>('today');

  const presets = [15, 25, 45, 60, 90];
  const today = new Date().toISOString().split('T')[0];

  // Auto-selection logic: find the first uncompleted habit or task
  React.useEffect(() => {
    const uncompletedHabits = habits.filter(h => !h.completedDates.includes(today));
    const uncompletedTasks = tasks.filter(t => !t.completed);

    // If current selected item is now completed, reset it
    if (selectedItem) {
      if (selectedItem.type === 'habit') {
        const habit = habits.find(h => h.id === selectedItem.id);
        if (!habit || habit.completedDates.includes(today)) setSelectedItem(null);
      } else if (selectedItem.type === 'task') {
        const task = tasks.find(t => t.id === selectedItem.id);
        if (!task || task.completed) setSelectedItem(null);
      }
    }

    // Only set a default if nothing is selected
    if (!selectedItem) {
      if (uncompletedHabits.length > 0) {
        setSelectedItem({ id: uncompletedHabits[0].id, type: 'habit' });
      } else if (uncompletedTasks.length > 0) {
        setSelectedItem({ id: uncompletedTasks[0].id, type: 'task' });
      } else {
        setSelectedItem({ id: GENERAL_GOALS[0].id, type: 'general' });
      }
    }
  }, [habits, tasks, selectedItem, today]);

  React.useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        }
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval);
            handleComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, minutes]);

  React.useEffect(() => {
    if (!isActive && !showPostSession) {
      setMinutes(mode === 'focus' ? focusDuration : breakDuration);
      setSeconds(0);
    }
  }, [focusDuration, breakDuration, mode, isActive, showPostSession]);

  const handleComplete = () => {
    setIsActive(false);

    if (mode === 'focus' && selectedItem) {
      onLogTime(selectedItem.id, selectedItem.type, focusDuration);
    } else if (mode === 'break') {
      onLogTime('break', 'break', breakDuration);
    }

    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    sound.play().catch(() => {});

    if (mode === 'focus') {
      if (autoStartBreak) {
        setMode('break');
        setMinutes(breakDuration);
        setSeconds(0);
        setIsActive(true);
      } else {
        setShowPostSession(true);
      }
    } else {
      setMode('focus');
      setMinutes(focusDuration);
      setSeconds(0);
    }
  };

  const startBreak = () => {
    setShowPostSession(false);
    setMode('break');
    setMinutes(breakDuration);
    setSeconds(0);
    setIsActive(true);
  };

  const startFocus = () => {
    setShowPostSession(false);
    setMode('focus');
    setMinutes(focusDuration);
    setSeconds(0);
    setIsActive(false);
  };

  const extendFocus = (mins: number) => {
    setShowPostSession(false);
    setMode('focus');
    setMinutes(mins);
    setSeconds(0);
    setIsActive(true);
  };

  const handleMarkAsDone = () => {
    if (selectedItem) {
      onMarkComplete(selectedItem.id, selectedItem.type);
      setShowLoggedPulse(true);
      setSelectedItem(null); // Clear selection so useEffect picks next uncompleted item
      setTimeout(() => setShowLoggedPulse(false), 3000);
      startBreak();
    }
  };

  const toggleTimer = () => {
    if (!isActive && mode === 'focus' && !selectedItem) {
      setShowErrorPulse(true);
      setTimeout(() => setShowErrorPulse(false), 3000);
      return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setShowPostSession(false);
    setMinutes(mode === 'focus' ? focusDuration : breakDuration);
    setSeconds(0);
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedItem(null);
      return;
    }
    const [type, id] = val.split(':');
    setSelectedItem({ id, type: type as 'habit' | 'task' | 'general' });
    setShowErrorPulse(false);
  };

  const getSelectedItemTitle = () => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'habit') return habits.find(h => h.id === selectedItem.id)?.title;
    if (selectedItem.type === 'task') return tasks.find(t => t.id === selectedItem.id)?.title;
    return t(`pomodoro.presets.${selectedItem.id}`);
  };

  const todaySessions = sessions.filter(s => s.timestamp.startsWith(today));

  const getFilteredSessions = () => {
    if (historyTab === 'today') return todaySessions;

    const now = new Date();
    if (historyTab === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return sessions.filter(s => new Date(s.timestamp) >= startOfWeek);
    }

    if (historyTab === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return sessions.filter(s => new Date(s.timestamp) >= startOfMonth);
    }

    return [];
  };

  const filteredSessions = getFilteredSessions();
  const totalFocusMinutes = filteredSessions
    .filter(s => s.type === 'focus')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="flex flex-col items-center justify-center animate-in zoom-in duration-500 py-8 px-4 relative max-w-2xl mx-auto pb-20">
      {/* Post Session Modal */}
      {showPostSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
              <Trophy size={40} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Session Complete!</h2>
              <p className="text-slate-500 mt-2">Amazing work on <span className="text-indigo-600 font-bold">{getSelectedItemTitle()}</span>.</p>
            </div>
            <div className="grid gap-3">
              <button
                onClick={handleMarkAsDone}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-100"
              >
                <CheckCircle size={20} />
                Mark Goal as Done
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => extendFocus(10)} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all">
                  <TimerReset size={18} /> +10m
                </button>
                <button onClick={startBreak} className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-4 rounded-2xl transition-all">
                  <Coffee size={18} /> Break
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showLoggedPulse && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg font-bold z-50 animate-bounce">Goal Updated!</div>}
      {showErrorPulse && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg font-bold z-50 animate-in fade-in">Select a goal first!</div>}

      {/* Main Timer Display */}
      <div className={`w-72 h-72 rounded-full flex flex-col items-center justify-center relative transition-all duration-700 mb-8 ${
        mode === 'focus' ? 'bg-white shadow-2xl shadow-indigo-100 border-indigo-50' : 'bg-white shadow-2xl shadow-emerald-100 border-emerald-50'
      }`}>
        <div className="absolute top-10 flex gap-2">
          <Brain size={18} className={mode === 'focus' ? 'text-indigo-600' : 'text-slate-200'} />
          <Coffee size={18} className={mode === 'break' ? 'text-emerald-500' : 'text-slate-200'} />
        </div>
        <div className={`text-6xl font-mono font-bold tracking-tighter ${isActive ? 'text-indigo-600' : 'text-slate-800'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="absolute bottom-10 flex gap-4">
          <button onClick={toggleTimer} className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${isActive ? 'bg-slate-800' : (mode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500')}`}>
            {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
          </button>
          <button onClick={resetTimer} className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"><RotateCcw size={20} /></button>
        </div>
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle cx="144" cy="144" r="140" fill="transparent" stroke={mode === 'focus' ? '#e0e7ff' : '#d1fae5'} strokeWidth="4" />
          <circle cx="144" cy="144" r="140" fill="transparent" stroke={mode === 'focus' ? '#6366f1' : '#10b981'} strokeWidth="4" strokeDasharray={2 * Math.PI * 140} strokeDashoffset={2 * Math.PI * 140 * (1 - (minutes * 60 + seconds) / (mode === 'focus' ? focusDuration * 60 : breakDuration * 60))} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
      </div>

      <div className="w-full space-y-6">
        {/* Settings and Selection */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Settings2 size={16} className="text-indigo-500" /> Timer Configuration</h3>
              <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                {showSettings ? 'Show Presets' : 'Custom Times'}
              </button>
            </div>

            {!showSettings ? (
              <div className="grid grid-cols-5 gap-2">
                {presets.map(p => (
                  <button key={p} onClick={() => setFocusDuration(p)} className={`py-3 rounded-xl text-xs font-bold transition-all ${focusDuration === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                    {p}m
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Focus Time</label>
                   <input type="number" value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Break Time</label>
                   <input type="number" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            )}

            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${autoStartBreak ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${autoStartBreak ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-white text-slate-400'}`}>
                  <Zap size={18} fill={autoStartBreak ? 'currentColor' : 'none'} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Auto-start next break</span>
                  <span className="text-[10px] text-slate-500 font-medium">Instantly transitions when session ends</span>
                </div>
              </div>
              <button onClick={() => setAutoStartBreak(!autoStartBreak)} className={`w-12 h-6 rounded-full relative transition-colors ${autoStartBreak ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${autoStartBreak ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
             <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Bell size={16} className="text-indigo-500" /> Focus Target</h3>
             <select value={selectedItem ? `${selectedItem.type}:${selectedItem.id}` : ''} onChange={handleItemChange} className="w-full text-xs font-bold bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl p-4 outline-none transition-all appearance-none cursor-pointer">
                <option value="">Choose your objective...</option>
                {/* Filter out habits that are already completed today */}
                {habits.filter(h => !h.completedDates.includes(today)).map(h => (
                  <option key={h.id} value={`habit:${h.id}`}>{h.title}</option>
                ))}
                {/* Filter out completed tasks */}
                {tasks.filter(t => !t.completed).map(t => (
                  <option key={t.id} value={`task:${t.id}`}>{t.title}</option>
                ))}
                {GENERAL_GOALS.map(g => (
                  <option key={g.id} value={`general:${g.id}`}>{t(`pomodoro.presets.${g.id}`)}</option>
                ))}
             </select>
          </div>
        </div>

        {/* History */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-900 font-bold flex items-center gap-2">
                <History size={18} className="text-indigo-500" /> {t('pomodoro.history')}
              </h3>
              <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full">
                <Clock size={12} className="text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-600">
                  {totalFocusMinutes}m {historyTab === 'today' ? t('pomodoro.today') : historyTab === 'week' ? t('pomodoro.thisWeek') : t('pomodoro.thisMonth')}
                </span>
              </div>
            </div>

            <div className="flex p-1 bg-slate-50 rounded-xl">
              {(['today', 'week', 'month'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    StorageService.trackEvent('session_history_tab_click', { tab });
                    setHistoryTab(tab);
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    historyTab === tab
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t(`pomodoro.${tab === 'week' ? 'thisWeek' : tab === 'month' ? 'thisMonth' : 'today'}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} className="text-slate-200" />
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {historyTab === 'today' ? t('pomodoro.noSessions') : historyTab === 'week' ? t('pomodoro.noSessionsWeek') : t('pomodoro.noSessionsMonth')}
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${session.type === 'focus' ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-emerald-600 shadow-sm'}`}>
                      {session.type === 'focus' ? <Brain size={18} /> : <Coffee size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{session.goalTitle}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-3 py-1 rounded-full ${session.type === 'focus' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {session.durationMinutes}m
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Trophy = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 22V18" /><path d="M14 22V18" /><path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
  </svg>
);

export default PomodoroTimer;
