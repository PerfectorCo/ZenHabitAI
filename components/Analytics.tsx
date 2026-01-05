
import React from 'react';
import { Habit } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar as CalendarIcon, Trophy, TrendingUp } from 'lucide-react';

interface AnalyticsProps {
  habits: Habit[];
}

const Analytics: React.FC<AnalyticsProps> = ({ habits }) => {
  // Generate dummy data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completions: habits.reduce((acc, h) => acc + (h.completedDates.includes(dateStr) ? 1 : 0), 0)
    };
  });

  const totalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
          <p className="text-slate-500">Visualizing your journey to consistency.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Weekly</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-100">Monthly</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Completions', value: totalCompletions, icon: Trophy, color: 'indigo' },
          { label: 'Avg Daily Score', value: '4.2', icon: TrendingUp, color: 'emerald' },
          { label: 'Days Tracked', value: '48', icon: CalendarIcon, color: 'violet' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Activity Trend</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="completions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="text-lg font-bold text-slate-900 mb-6">Habit Breakdown</h3>
           <div className="space-y-6">
              {habits.map(habit => {
                const percentage = Math.min(Math.round((habit.completedDates.length / 30) * 100), 100);
                return (
                  <div key={habit.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-700">{habit.title}</span>
                      <span className="text-slate-400 font-bold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
