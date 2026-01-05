
import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Bell, CheckCircle2, PlusCircle, Settings2, AlertCircle, CheckCircle, TimerReset, Zap, History, Clock } from 'lucide-react';
import { Habit, Task, FocusSession } from '../types';

export const GENERAL_GOALS = [
  { id: 'reading', title: 'Đọc sách 📖', category: 'Learning' },
  { id: 'learning', title: 'Học tập 🧠', category: 'Skills' },
  { id: 'meditation', title: 'Thiền định 🧘', category: 'Mindset' },
  { id: 'exercise', title: 'Tập thể dục 🏃', category: 'Health' }
];

interface PomodoroTimerProps {
  habits: Habit[];
  tasks: Task[];
  sessions: FocusSession[];
  onLogTime: (id: string, type: 'habit' | 'task' | 'general' | 'break', minutes: number) => void;
  onMarkComplete: (id: string, type: 'habit' | 'task' | 'general') => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ habits, tasks, sessions, onLogTime, onMarkComplete }) => {
  const [focusDuration, setFocusDuration] = React.useState(25);
  const [breakDuration, setBreakDuration] = React.useState(5);
  const [autoStartBreak, setAutoStartBreak] = React.useState(false);
  
  const [minutes, setMinutes] = React.useState(25);
  const [seconds, setSeconds] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const [mode, setMode] = React.useState<'focus' | 'break'>('focus');
  const [selectedItem, setSelectedItem] = React.useState<{ id: string, type: 'habit' | 'task' | 'general' } | null>(null);
  const [showLoggedPulse, setShowLoggedPulse] = React.useState(false);
  const [showErrorPulse, setShowErrorPulse] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showPostSession, setShowPostSession] = React.useState(false);

  const presets = [15, 25, 45, 60, 90];

  // Effect to automatically select the first available item if none is selected
  React.useEffect(() => {
    if (!selectedItem) {
      if (habits.length > 0) {
        setSelectedItem({ id: habits[0].id, type: 'habit' });
      } else {
        const activeTasks = tasks.filter(t => !t.completed);
        if (activeTasks.length > 0) {
          setSelectedItem({ id: activeTasks[0].id, type: 'task' });
        } else {
          setSelectedItem({ id: GENERAL_GOALS[0].id, type: 'general' });
        }
      }
    }
  }, [habits, tasks, selectedItem]);

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

  // Sync timer display with settings when not active
  React.useEffect(() => {
    if (!isActive && !showPostSession) {
      setMinutes(mode === 'focus' ? focusDuration : breakDuration);
      setSeconds(0);
    }
  }, [focusDuration, breakDuration, mode, isActive, showPostSession]);

  const handleComplete = () => {
    setIsActive(false);
    
    // Log time automatically if it was focus
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
    return GENERAL_GOALS.find(g => g.id === selectedItem.id)?.title;
  };

  // Filter sessions for today only
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.timestamp.startsWith(today));
  const totalFocusMinutes = todaySessions
    .filter(s => s.type === 'focus')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="flex flex-col items-center justify-center animate-in zoom-in duration-500 py-8 px-4 relative max-w-2xl mx-auto">
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
        mode === 'focus' ? 'bg-white shadow-2xl shadow-indigo-100 border-4 border-indigo-50' : 'bg-white shadow-2xl shadow-emerald-100 border-4 border-emerald-50'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Settings2 size={16} /> Timer</h3>
              <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] font-bold text-indigo-600 underline">Custom</button>
            </div>
            {!showSettings ? (
              <div className="grid grid-cols-3 gap-2">
                {[15, 25, 45].map(p => (
                  <button key={p} onClick={() => setFocusDuration(p)} className={`py-2 rounded-xl text-xs font-bold ${focusDuration === p ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{p}m</button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 animate-in slide-in-from-top-1">
                <input type="number" value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))} className="w-1/2 px-3 py-2 bg-slate-50 rounded-lg text-xs" placeholder="Focus" />
                <input type="number" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-1/2 px-3 py-2 bg-slate-50 rounded-lg text-xs" placeholder="Break" />
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Auto Break</span>
              <button onClick={() => setAutoStartBreak(!autoStartBreak)} className={`w-10 h-5 rounded-full relative transition-colors ${autoStartBreak ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${autoStartBreak ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
             <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Bell size={16} /> Working On</h3>
             <select value={selectedItem ? `${selectedItem.type}:${selectedItem.id}` : ''} onChange={handleItemChange} className="w-full text-xs font-medium bg-slate-50 border-none rounded-xl p-3 outline-none">
                <option value="">Choose goal...</option>
                {habits.map(h => <option key={h.id} value={`habit:${h.id}`}>{h.title}</option>)}
                {tasks.filter(t => !t.completed).map(t => <option key={t.id} value={`task:${t.id}`}>{t.title}</option>)}
                {GENERAL_GOALS.map(g => <option key={g.id} value={`general:${g.id}`}>{g.title}</option>)}
             </select>
          </div>
        </div>

        {/* Focus History Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-900 font-bold flex items-center gap-2">
              <History size={18} className="text-indigo-500" /> Today's Focus History
            </h3>
            <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full">
              <Clock size={12} className="text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-600">{totalFocusMinutes}m Total Focus</span>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {todaySessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 font-medium italic">No sessions logged yet today.</p>
                <p className="text-[10px] text-slate-300 mt-1">Start your first session to see history here!</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 animate-in slide-in-from-left-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${session.type === 'focus' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {session.type === 'focus' ? <Brain size={16} /> : <Coffee size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{session.goalTitle}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${session.type === 'focus' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
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
