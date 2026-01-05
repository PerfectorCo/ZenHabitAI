
import React from 'react';
import { Plus, Check, Circle, Trash2, Calendar, Target, CheckCircle2, AlarmClock, BellRing, Repeat, Library, Zap, Edit3, CheckCircle } from 'lucide-react';
import { Habit, Task, TaskTemplate } from '../types';

interface HabitManagerProps {
  habits: Habit[];
  tasks: Task[];
  categories: string[];
  templates: TaskTemplate[];
  onAddHabit: (title: string, category: string, reminderTime?: string) => void;
  onToggleHabit: (id: string) => void;
  onAddLevelTask: (title: string, isRecurring: boolean) => void;
  onAddFromTemplate: (template: TaskTemplate) => void;
  onDeleteHabit: (id: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const HabitManager: React.FC<HabitManagerProps> = ({ 
  habits, 
  tasks, 
  categories,
  templates,
  onAddHabit, 
  onToggleHabit, 
  onAddLevelTask,
  onAddFromTemplate,
  onDeleteHabit,
  onToggleTask,
  onDeleteTask
}) => {
  const [newHabitTitle, setNewHabitTitle] = React.useState('');
  const [category, setCategory] = React.useState('Health');
  const [customCategory, setCustomCategory] = React.useState('');
  const [isCustomCategory, setIsCustomCategory] = React.useState(false);
  const [reminderTime, setReminderTime] = React.useState('');

  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isTaskRecurring, setIsTaskRecurring] = React.useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Sync category state with first available if 'Health' is gone or list changes
  React.useEffect(() => {
    if (!categories.includes(category) && categories.length > 0 && !isCustomCategory) {
      setCategory(categories[0]);
    }
  }, [categories]);

  const handleHabitAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    
    if (newHabitTitle.trim() && finalCategory) {
      // Case 1: Title and Category provided -> Add Habit
      onAddHabit(newHabitTitle, finalCategory, reminderTime || undefined);
      
      // Keep the category selected for the next addition
      setCategory(finalCategory);
      
      // Reset other fields
      setNewHabitTitle('');
      setReminderTime('');
      setCustomCategory('');
      setIsCustomCategory(false);
    } else if (isCustomCategory && finalCategory) {
      // Case 2: Only custom category provided -> Just confirm it and switch back
      setCategory(finalCategory);
      setIsCustomCategory(false);
      setCustomCategory('');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM_NEW') {
      setIsCustomCategory(true);
      setCustomCategory('');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
    }
  };

  const handleTaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddLevelTask(newTaskTitle, isTaskRecurring);
      setNewTaskTitle('');
      setIsTaskRecurring(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Structure Your Day</h1>
        <p className="text-slate-500">Combine long-term habits with daily recurring tasks.</p>
      </header>

      {/* Habit Creation Section */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
           <Zap className="text-indigo-500" size={24} /> New Habit Goal
        </h2>
        <form onSubmit={handleHabitAdd} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Action Description</label>
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="e.g. 20 pushups every morning"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800"
            />
          </div>
          
          <div className="w-56 relative">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Category</label>
            {!isCustomCategory ? (
              <div className="relative">
                <select 
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-slate-800 pr-10"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="CUSTOM_NEW" className="text-indigo-600 font-bold font-black">+ Create New...</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Plus size={14} />
                </div>
              </div>
            ) : (
              <div className="relative animate-in slide-in-from-right-2 duration-300">
                <input
                  type="text"
                  autoFocus
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleHabitAdd();
                    }
                  }}
                  placeholder="Enter name..."
                  className="w-full px-5 py-4 rounded-2xl bg-indigo-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-indigo-900 pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => handleHabitAdd()}
                    className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all"
                    title="Save Category & Habit"
                  >
                    <CheckCircle size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="p-2 text-indigo-300 hover:text-indigo-500"
                    title="Cancel"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-40">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
              <AlarmClock size={12} /> Reminder
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            />
          </div>
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 whitespace-nowrap"
          >
            <Plus size={20} /> Add Habit
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Habits List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Target className="text-indigo-500" size={24} />
            Daily Streaks
          </h2>
          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400">
                <Target size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-medium">No habits yet. Every journey begins with one step.</p>
              </div>
            ) : (
              habits.map((habit) => {
                const isCompletedToday = habit.completedDates.includes(today);
                return (
                  <div key={habit.id} className="group flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <button 
                      onClick={() => onToggleHabit(habit.id)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all ${
                        isCompletedToday 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'border-slate-100 text-transparent hover:border-indigo-200 hover:text-indigo-100 bg-slate-50'
                      }`}
                    >
                      <Check size={20} />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold text-base ${isCompletedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {habit.title}
                        </h4>
                        {habit.reminderTime && (
                          <div className="flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-black uppercase">
                            <BellRing size={10} /> {habit.reminderTime}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{habit.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-black text-indigo-600">{habit.streak}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">Days</div>
                      </div>
                      <button 
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <Calendar className="text-violet-500" size={24} />
            Tasks & Chores
          </h2>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
             {/* Task Library / Templates */}
             <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-white/60">
                   <Library size={16} />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em]">Templates Library</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                   {templates.map(tmpl => (
                      <button 
                        key={tmpl.id}
                        onClick={() => onAddFromTemplate(tmpl)}
                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 group"
                      >
                        <Plus size={12} className="group-hover:scale-125 transition-transform" />
                        {tmpl.title}
                        {tmpl.isRecurring && <Repeat size={10} className="text-indigo-400" />}
                      </button>
                   ))}
                </div>
             </div>

             <form onSubmit={handleTaskAdd} className="flex gap-3 mb-8">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Quick action today..." 
                    className="w-full bg-white/10 border-none text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-400 font-medium placeholder:text-white/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsTaskRecurring(!isTaskRecurring)}
                      className={`p-2 rounded-lg transition-all ${isTaskRecurring ? 'bg-indigo-500 text-white' : 'text-white/20 hover:text-white/40'}`}
                      title="Repeat Daily"
                    >
                      <Repeat size={18} />
                    </button>
                  </div>
                </div>
                <button type="submit" className="bg-white text-slate-900 px-5 rounded-2xl hover:bg-indigo-50 transition-colors">
                  <Plus size={24} />
                </button>
             </form>

             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.filter(t => !t.completed).length === 0 && tasks.filter(t => t.completed).length === 0 ? (
                  <p className="text-center py-10 text-white/20 text-sm font-medium italic">Empty for now. Use the templates above!</p>
                ) : (
                  <>
                    {tasks.filter(t => !t.completed).map(task => (
                      <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.5rem] transition-colors group">
                        <button onClick={() => onToggleTask(task.id)} className="text-white/20 hover:text-indigo-400 transition-colors">
                          <Circle size={22} />
                        </button>
                        <div className="flex-1">
                           <span className="text-sm font-bold block">{task.title}</span>
                           {task.isRecurring && (
                             <span className="text-[9px] text-indigo-400 font-black uppercase flex items-center gap-1 mt-0.5">
                               <Repeat size={8} /> Daily Reset
                             </span>
                           )}
                        </div>
                        <button onClick={() => onDeleteTask(task.id)} className="text-white/0 group-hover:text-white/20 hover:text-red-400 transition-all">
                           <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {tasks.filter(t => t.completed).length > 0 && (
                      <div className="pt-6 border-t border-white/10 mt-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/30">Done & Dusted</p>
                        {tasks.filter(t => t.completed).map(task => (
                          <div key={task.id} className="flex items-center gap-4 p-4 opacity-40 hover:opacity-100 transition-opacity">
                            <button onClick={() => onToggleTask(task.id)} className="text-indigo-400">
                              <CheckCircle2 size={22} />
                            </button>
                            <span className="flex-1 text-sm font-medium line-through">{task.title}</span>
                            <button onClick={() => onDeleteTask(task.id)} className="text-white/20 hover:text-red-400">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitManager;
