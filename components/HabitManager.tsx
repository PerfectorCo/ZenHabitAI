
import React from 'react';
// Added missing CheckCircle2 icon import
import { Plus, Check, Circle, Trash2, Calendar, Target, CheckCircle2 } from 'lucide-react';
import { Habit, Task } from '../types';

interface HabitManagerProps {
  habits: Habit[];
  tasks: Task[];
  onAddHabit: (title: string, category: string) => void;
  onToggleHabit: (id: string) => void;
  onAddLevelTask: (title: string) => void;
  onDeleteHabit: (id: string) => void;
}

const HabitManager: React.FC<HabitManagerProps> = ({ 
  habits, 
  tasks, 
  onAddHabit, 
  onToggleHabit, 
  onAddLevelTask,
  onDeleteHabit
}) => {
  const [newHabitTitle, setNewHabitTitle] = React.useState('');
  const [category, setCategory] = React.useState('Health');

  const today = new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitTitle.trim()) {
      onAddHabit(newHabitTitle, category);
      setNewHabitTitle('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Build Better Habits</h1>
        <p className="text-slate-500">Transform your life, one tiny habit at a time.</p>
      </header>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">I want to...</label>
          <input
            type="text"
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="e.g. Meditate for 10 minutes"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white"
          >
            <option>Health</option>
            <option>Mindset</option>
            <option>Work</option>
            <option>Skills</option>
          </select>
        </div>
        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Create Habit
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Target className="text-indigo-500" size={20} />
            Your Habits
          </h2>
          {habits.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
              No habits yet. Start small!
            </div>
          ) : (
            habits.map((habit) => {
              const isCompletedToday = habit.completedDates.includes(today);
              return (
                <div key={habit.id} className="group flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <button 
                    onClick={() => onToggleHabit(habit.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompletedToday 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-200 text-transparent hover:border-indigo-400 hover:text-indigo-100'
                    }`}
                  >
                    <Check size={18} />
                  </button>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isCompletedToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {habit.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{habit.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-700">{habit.streak}d</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Streak</div>
                    </div>
                    <button 
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Calendar className="text-violet-500" size={20} />
            Today's Quick Tasks
          </h2>
          <div className="bg-slate-900 rounded-3xl p-6 text-white min-h-[300px]">
             <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  placeholder="Quick task..." 
                  className="bg-white/10 border-white/20 text-white rounded-lg px-3 py-2 flex-1 outline-none focus:ring-1 focus:ring-indigo-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddLevelTask(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
             </div>
             <div className="space-y-3">
                {tasks.filter(t => !t.completed).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <Circle size={18} className="text-white/30" />
                    <span className="flex-1 text-sm font-medium">{task.title}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10 mt-4 opacity-50">
                   <p className="text-xs font-bold uppercase tracking-widest mb-3">Completed</p>
                   {tasks.filter(t => t.completed).map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2">
                        <CheckCircle2 size={16} className="text-indigo-400" />
                        <span className="text-sm line-through text-white/40">{task.title}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitManager;
