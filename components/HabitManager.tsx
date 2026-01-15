
import React from 'react';
import { Plus, Check, Circle, Trash2, Calendar, Target, CheckCircle2, AlarmClock, BellRing, Repeat, Library, Zap, Edit3, CheckCircle, FastForward, Undo2, Star, X, Pencil, Save, Leaf, Clock } from 'lucide-react';
import { Habit, Task, TaskTemplate } from '../types';
import { useLanguage } from '../LanguageContext';

interface HabitManagerProps {
  habits: Habit[];
  tasks: Task[];
  categories: string[];
  templates: TaskTemplate[];
  onAddHabit: (title: string, category: string, reminderTime?: string) => void;
  onToggleHabit: (id: string) => void;
  onAddLevelTask: (title: string, isRecurring: boolean, repeatDays?: number[]) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddFromTemplate: (template: TaskTemplate) => void;
  onSaveTemplate: (task: Task) => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleTask: (id: string) => void;
  onSkipTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HabitManager: React.FC<HabitManagerProps> = ({
  habits,
  tasks,
  categories,
  templates,
  onAddHabit,
  onToggleHabit,
  onAddLevelTask,
  onUpdateTask,
  onAddFromTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onDeleteHabit,
  onToggleTask,
  onSkipTask,
  onDeleteTask
}) => {
  const { t, language } = useLanguage();
  const [newHabitTitle, setNewHabitTitle] = React.useState('');
  const [category, setCategory] = React.useState('Health');
  const [customCategory, setCustomCategory] = React.useState('');
  const [isCustomCategory, setIsCustomCategory] = React.useState(false);
  const [reminderTime, setReminderTime] = React.useState('');

  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isTaskRecurring, setIsTaskRecurring] = React.useState(false);
  const [repeatDays, setRepeatDays] = React.useState<number[]>([0,1,2,3,4,5,6]);

  // Editing state
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editRepeatDays, setEditRepeatDays] = React.useState<number[]>([]);
  const [editIsRecurring, setEditIsRecurring] = React.useState(false);

  // Completed tasks history filter
  const [completedTasksPeriod, setCompletedTasksPeriod] = React.useState<'day' | 'week' | 'month'>('day');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDay = today.getDay();

  const handleHabitAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    if (newHabitTitle.trim() && finalCategory) {
      onAddHabit(newHabitTitle, finalCategory, reminderTime || undefined);
      setNewHabitTitle('');
      setReminderTime('');
      setIsCustomCategory(false);
    }
  };

  const handleTaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddLevelTask(newTaskTitle, isTaskRecurring, isTaskRecurring ? repeatDays : undefined);
      setNewTaskTitle('');
      setIsTaskRecurring(false);
      setRepeatDays([0,1,2,3,4,5,6]);
    }
  };

  const toggleRepeatDay = (day: number) => {
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditIsRecurring(!!task.isRecurring);
    setEditRepeatDays(task.repeatDays || [0,1,2,3,4,5,6]);
  };

  const handleSaveEdit = () => {
    if (editingTaskId) {
      onUpdateTask(editingTaskId, {
        title: editTitle,
        isRecurring: editIsRecurring,
        repeatDays: editIsRecurring ? editRepeatDays : undefined
      });
      setEditingTaskId(null);
    }
  };

  const toggleEditRepeatDay = (day: number) => {
    setEditRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const pendingTasks = tasks.filter(t =>
    !t.completed && !t.skippedDates?.includes(todayStr) && (!t.isRecurring || t.repeatDays?.includes(todayDay))
  );

  const completedTasks = tasks.filter(t => t.completed);
  const skippedTasks = tasks.filter(t => !t.completed && t.skippedDates?.includes(todayStr));

  // Helper function to check if a date is within the specified period
  const isDateInPeriod = (dateStr: string, period: 'day' | 'week' | 'month'): boolean => {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'day') {
      return dateStr === todayStr;
    } else if (period === 'week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return date >= weekStart && date <= today;
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= monthStart && date <= today;
    }
  };

  // Get completed tasks grouped by date for the selected period
  const getCompletedTasksByPeriod = (): Array<{ date: string; tasks: Task[] }> => {
    const completedTasksWithDates: Array<{ task: Task; date: string }> = [];

    tasks.forEach(task => {
      if (task.completedDates && task.completedDates.length > 0) {
        task.completedDates.forEach(dateStr => {
          if (isDateInPeriod(dateStr, completedTasksPeriod)) {
            completedTasksWithDates.push({ task, date: dateStr });
          }
        });
      }
    });

    // Group by date
    const grouped = completedTasksWithDates.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      if (!acc[item.date].find(t => t.id === item.task.id)) {
        acc[item.date].push(item.task);
      }
      return acc;
    }, {} as Record<string, Task[]>);

    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .map(([date, tasks]) => ({ date, tasks }))
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  const completedTasksByPeriod = getCompletedTasksByPeriod();

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === todayStr) {
      return t('habits.completedTasks.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('habits.completedTasks.yesterday');
    } else {
      return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('habits.header')}</h1>
        <p className="text-slate-500">{t('habits.subtitle')}</p>
      </header>

      {/* Habit Creation */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
           <Zap className="text-indigo-500" size={24} /> {t('habits.newHabit')}
        </h2>
        <form onSubmit={handleHabitAdd} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">{t('habits.description')}</label>
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder={t('habits.descriptionPlh')}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800"
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
            <Plus size={20} /> {t('habits.addHabit')}
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3"><Target className="text-indigo-500" size={24} /> {t('habits.streaks')}</h2>
          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="bg-white p-8 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-700">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <Leaf size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 font-serif italic text-lg">{t('habits.emptyStreaksTitle')}</h3>
                  <p className="text-sm text-slate-500 max-w-[240px] leading-relaxed">
                    {t('habits.emptyStreaksMessage')}
                  </p>
                </div>
              </div>
            ) : (
              habits.map((habit) => (
                <div key={habit.id} className="group flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <button onClick={() => onToggleHabit(habit.id)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 ${habit.completedDates.includes(todayStr) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-100 text-transparent bg-slate-50'}`}><Check size={20} /></button>
                  <div className="flex-1">
                    <h4 className={`font-bold text-base ${habit.completedDates.includes(todayStr) ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{habit.title}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{habit.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-600">{habit.streak}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-black">{t('common.days')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3"><Calendar className="text-violet-500" size={24} /> {t('habits.tasks')}</h2>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">

             {/* Presets Library */}
             <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-white/60">
                  <Library size={16} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t('habits.presets')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                   {templates.map(tmpl => (
                      <div key={tmpl.id} className="flex items-center bg-white/10 hover:bg-white/20 rounded-xl overflow-hidden group transition-all">
                        <button
                          onClick={() => onAddFromTemplate(tmpl)}
                          className="pl-4 pr-2 py-2 text-xs font-bold flex items-center gap-2"
                        >
                          <Plus size={12} className="group-hover:scale-125 transition-transform" />
                          {tmpl.title}
                          {tmpl.isRecurring && <Repeat size={10} className="text-indigo-400" />}
                        </button>
                        <button
                          onClick={() => onDeleteTemplate(tmpl.id)}
                          className="pr-2 py-2 text-white/20 hover:text-red-400 transition-colors"
                          title={t('habits.removeFromPresets')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                   ))}
                </div>
             </div>

             <form onSubmit={handleTaskAdd} className="space-y-4 mb-8">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={t('habits.quickAction')} className="w-full bg-white/10 border-none text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-400 font-medium placeholder:text-white/20" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <button type="button" onClick={() => setIsTaskRecurring(!isTaskRecurring)} className={`p-2 rounded-lg transition-all ${isTaskRecurring ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'text-white/20 hover:text-white/40'}`} title={t('habits.setRecurringTask')}><Repeat size={18} /></button>
                    </div>
                  </div>
                  <button type="submit" className="bg-white text-slate-900 px-5 rounded-2xl hover:bg-indigo-50 transition-colors"><Plus size={24} /></button>
                </div>

                {isTaskRecurring && (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">{t('habits.repeatOn')}</span>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <button key={idx} type="button" onClick={() => toggleRepeatDay(idx)} className={`min-w-[42px] h-9 px-2 rounded-lg text-[10px] font-black transition-all ${repeatDays.includes(idx) ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>{day}</button>
                      ))}
                    </div>
                  </div>
                )}
             </form>

             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingTasks.map(task => (
                  <div key={task.id} className={`flex flex-col p-4 rounded-[1.5rem] transition-all group ${editingTaskId === task.id ? 'bg-white/10 ring-1 ring-indigo-400/50' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-4">
                      {editingTaskId !== task.id ? (
                        <>
                          <button onClick={() => onToggleTask(task.id)} className="text-white/20 hover:text-indigo-400 transition-colors"><Circle size={22} /></button>
                          <div className="flex-1">
                             <span className="text-sm font-bold block">{task.title}</span>
                             {task.isRecurring && (
                               <span className="text-[9px] text-indigo-400 font-black uppercase flex items-center gap-1 mt-0.5">
                                 <Repeat size={8} /> {task.repeatDays?.length === 7 ? t('common.everyDay') : task.repeatDays?.map(d => DAYS_OF_WEEK[d]).join(', ')}
                               </span>
                             )}
                          </div>
                          <div className="flex items-center gap-1">
                             <button onClick={() => handleStartEdit(task)} className="p-2 text-white/0 group-hover:text-white/20 hover:text-indigo-400" title="Edit task"><Pencil size={16} /></button>
                             <button onClick={() => onSaveTemplate(task)} className="p-2 text-white/0 group-hover:text-white/20 hover:text-yellow-400" title="Save as template"><Star size={16} /></button>
                             <button onClick={() => onSkipTask(task.id)} className="p-2 text-white/0 group-hover:text-white/20 hover:text-orange-400" title="Skip for today"><FastForward size={18} /></button>
                             <button onClick={() => onDeleteTask(task.id)} className="p-2 text-white/0 group-hover:text-white/20 hover:text-red-400"><Trash2 size={16} /></button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 space-y-4 animate-in fade-in duration-300">
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              className="flex-1 bg-white/5 border-none text-white rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-indigo-400 text-sm font-bold"
                            />
                            <button onClick={() => setEditIsRecurring(!editIsRecurring)} className={`p-2 rounded-xl transition-all ${editIsRecurring ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-white/40'}`}><Repeat size={18} /></button>
                            <button onClick={handleSaveEdit} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-xl transition-colors"><Save size={18} /></button>
                            <button onClick={() => setEditingTaskId(null)} className="text-white/20 hover:text-white/40"><X size={18} /></button>
                          </div>
                          {editIsRecurring && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                              {DAYS_OF_WEEK.map((day, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleEditRepeatDay(idx)}
                                  className={`min-w-[36px] h-8 px-1.5 rounded-lg text-[9px] font-black transition-all ${editRepeatDays.includes(idx) ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/30'}`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {skippedTasks.length > 0 && (
                  <div className="pt-6 border-t border-white/10 mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-orange-400/60">Postponed for Today</p>
                    {skippedTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-4 p-4 bg-orange-500/5 rounded-2xl group border border-orange-500/10">
                        <button onClick={() => onSkipTask(task.id)} className="text-orange-400 hover:text-orange-500"><Undo2 size={20} /></button>
                        <div className="flex-1">
                           <span className="text-sm font-bold text-orange-100/60 italic">{task.title}</span>
                        </div>
                        <button onClick={() => onDeleteTask(task.id)} className="text-white/0 group-hover:text-white/20 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {completedTasks.length > 0 && (
                  <div className="pt-6 border-t border-white/10 mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-400/40">Done & Dusted</p>
                    {completedTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-4 p-4 opacity-40 hover:opacity-100 transition-opacity">
                        <button onClick={() => onToggleTask(task.id)} className="text-indigo-400"><CheckCircle2 size={22} /></button>
                        <span className="flex-1 text-sm font-medium line-through">{task.title}</span>
                        <button onClick={() => onDeleteTask(task.id)} className="text-white/20 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Completed Tasks History */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="text-emerald-500" size={24} /> {t('habits.completedTasks.title')}
          </h2>
          <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
            {(['day', 'week', 'month'] as const).map(period => (
              <button
                key={period}
                onClick={() => setCompletedTasksPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  completedTasksPeriod === period
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t(`habits.completedTasks.${period}`)}
              </button>
            ))}
          </div>
        </div>

        {completedTasksByPeriod.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">{t('habits.completedTasks.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {completedTasksByPeriod.map(({ date, tasks }) => (
              <div key={date} className="border border-slate-100 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {formatDate(date)}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                    {tasks.length} {tasks.length === 1 ? t('habits.completedTasks.task') : t('habits.completedTasks.tasks')}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div
                      key={`${task.id}-${date}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className="flex-1 text-sm font-medium text-slate-700">{task.title}</span>
                      {task.isRecurring && (
                        <Repeat size={14} className="text-indigo-400 flex-shrink-0" title={t('habits.completedTasks.recurring')} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HabitManager;
