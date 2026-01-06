
import React from 'react';
import { Habit, FocusSession, Task, UserProfile, StoredAIInsights } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar as CalendarIcon, Trophy, TrendingUp, Sparkles, Wand2, CheckCircle, ClipboardList, Clock, RefreshCw, Lock, Heart, X } from 'lucide-react';
import { getAIInsights } from '../services/geminiService';
import { useLanguage } from '../LanguageContext';
import { StorageService } from '../services/storageService';

interface AnalyticsProps {
  habits: Habit[];
  tasks: Task[];
  sessions: FocusSession[];
  profile: UserProfile;
  onNavigateToPricing?: () => void;
}

type Period = 'day' | 'week' | 'month';

const INSIGHT_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const Analytics: React.FC<AnalyticsProps> = ({ habits, tasks, sessions, profile, onNavigateToPricing }) => {
  const [period, setPeriod] = React.useState<Period>('week');
  const [aiInsight, setAiInsight] = React.useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = React.useState(false);
  const [showInvitation, setShowInvitation] = React.useState<'insights' | 'history' | null>(null);
  const { language, t } = useLanguage();

  const isPro = profile.subscription === 'pro' || profile.subscription === 'master';

  const fetchInsight = async (forceRefresh = false) => {
    // Feature Gate: Only Pro gets Daily/Monthly insights
    if ((period === 'day' || period === 'month') && !isPro) {
      setAiInsight(t('pricing.limitations.dailyMonthly'));
      return;
    }

    setLoadingInsight(true);
    
    if (!forceRefresh) {
      const storedInsights = StorageService.getStoredAIInsights();
      const cached = storedInsights.find(i => i.period === period);
      if (cached) {
        const isStale = Date.now() - new Date(cached.timestamp).getTime() > INSIGHT_CACHE_TTL;
        const langChanged = cached.language !== language;
        if (!isStale && !langChanged) {
          setAiInsight(cached.insight);
          setLoadingInsight(false);
          return;
        }
      }
    }

    const insight = await getAIInsights(habits, tasks, sessions, profile, period, language);
    setAiInsight(insight);
    
    // Cache the result
    const newCache: StoredAIInsights = {
      period,
      insight,
      timestamp: new Date().toISOString(),
      language: language
    };
    StorageService.saveAIInsight(newCache);
    
    setLoadingInsight(false);
  };

  React.useEffect(() => {
    fetchInsight();
  }, [period, language]);

  const handlePeriodChange = (p: Period) => {
    if ((p === 'day' || p === 'month') && !isPro) {
      setShowInvitation('insights');
    }
    setPeriod(p);
  };

  const getChartData = () => {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    // Feature Gate: Limited history for free users in Monthly view
    const displayDays = (period === 'month' && !isPro) ? 14 : days;

    return Array.from({ length: displayDays }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (displayDays - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      
      const habitCheckmarks = habits.reduce((acc, h) => acc + (h.completedDates.includes(dateStr) ? 1 : 0), 0);
      const taskCheckmarks = tasks.reduce((acc, t) => acc + (t.completedDates?.includes(dateStr) ? 1 : 0), 0);
      const focusSessionsCount = sessions.filter(s => 
        s.timestamp.startsWith(dateStr) && 
        s.type === 'focus'
      ).length;
      
      return {
        date: days <= 7 ? d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' }) : d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' }),
        "Habit Wins": habitCheckmarks,
        "Task Wins": taskCheckmarks,
        "Focus Power": focusSessionsCount,
        "Total Intensity": habitCheckmarks + taskCheckmarks + focusSessionsCount
      };
    });
  };

  const totalHabitCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const totalTasksCompleted = tasks.filter(t => t.completed).length;
  const totalCompletions = totalHabitCompletions + totalTasksCompleted;
  const totalFocusMins = sessions.filter(s => s.type === 'focus').reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('analytics.header')}</h1>
          <p className="text-slate-500">{t('analytics.subtitle')}</p>
        </div>
        <div className="relative inline-flex p-1 bg-slate-100 rounded-xl">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                period === p 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p.toUpperCase()}
              {((p === 'day' || p === 'month') && !isPro) && <Lock size={10} className="text-slate-300" />}
            </button>
          ))}
        </div>
      </header>

      {/* Zen Invitation Overlay */}
      {showInvitation && (
        <div className="bg-white border border-indigo-50 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
          <button onClick={() => setShowInvitation(null)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors">
            <X size={20} />
          </button>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
              <Heart size={32} className="fill-indigo-500/20" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                {t(`pricing.triggers.${showInvitation}.title`)}
              </h2>
              <p className="text-slate-500 italic leading-relaxed max-w-2xl font-light">
                "{t(`pricing.triggers.${showInvitation}.message`)}"
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 min-w-[160px]">
              <button 
                onClick={onNavigateToPricing}
                className="w-full py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
              >
                {t('common.goPro')}
              </button>
              <button onClick={() => setShowInvitation(null)} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                {t('common.later')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden transition-all duration-700">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400">
              <div className="animate-pulse w-2 h-2 bg-indigo-400 rounded-full mr-2" />
              <Sparkles size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">{t('analytics.zenInsights')}</span>
          </div>
          {loadingInsight ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-white/10 rounded-full w-full" />
              <div className="h-4 bg-white/10 rounded-full w-4/5" />
            </div>
          ) : (
            <p className="text-xl font-medium italic leading-relaxed text-indigo-100">
              "{aiInsight}"
            </p>
          )}
          <button 
            onClick={() => fetchInsight(true)}
            disabled={loadingInsight || (!isPro && period !== 'week')}
            className={`mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-30 ${isPro ? 'text-white/40 hover:text-white' : 'text-white/20'}`}
          >
            <RefreshCw size={12} className={loadingInsight ? "animate-spin" : ""} /> {t('analytics.analyzeNew')}
          </button>
        </div>
        <div className="absolute top-[-20%] right-[-10%] opacity-10 pointer-events-none">
           <Trophy size={320} className="text-white" />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t('analytics.totalCompletions'), value: totalCompletions, icon: Trophy, color: 'indigo', sub: 'Habits + Tasks' },
          { label: t('analytics.focusTime'), value: `${totalFocusMins}m`, icon: Clock, color: 'emerald', sub: 'Active work' },
          { label: t('analytics.activeTasks'), value: tasks.length, icon: ClipboardList, color: 'amber', sub: `${totalTasksCompleted} done` },
          { label: t('analytics.growthPeriod'), value: period.charAt(0).toUpperCase() + period.slice(1), icon: CalendarIcon, color: 'violet', sub: 'Current view' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 ${
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                'bg-violet-50 text-violet-600'
              }`}>
                <Icon size={24} />
              </div>
              <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
              <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{stat.sub}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group">
            {period === 'month' && !isPro && (
               <div 
                 onClick={() => setShowInvitation('history')}
                 className="absolute inset-0 z-10 bg-white/20 backdrop-blur-[1px] flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-indigo-50 shadow-xl text-[10px] font-black uppercase tracking-widest text-indigo-600">
                   {t('common.goPro')}
                 </div>
               </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-500" />
                {t('analytics.heatwave')}
              </h3>
            </div>
            <div className="h-[320px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()}>
                    <defs>
                      <linearGradient id="colorHabits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8', fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8', fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '24px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Habit Wins" 
                      stackId="1"
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorHabits)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Task Wins" 
                      stackId="1"
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTasks)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Focus Power" 
                      stackId="1"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorSessions)" 
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle size={20} className="text-emerald-500" />
                {t('analytics.performance')}
             </h3>
             {tasks.length === 0 ? (
               <div className="text-center py-10 text-slate-400 italic font-medium">No tasks to analyze today.</div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     {tasks.map(task => (
                       <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-300'}`}>
                                <CheckCircle size={16} />
                             </div>
                             <span className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                          </div>
                          {task.isRecurring && <div className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase">Daily</div>}
                       </div>
                     ))}
                  </div>
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                     <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                        <svg className="w-full h-full -rotate-90">
                           <circle cx="64" cy="64" r="58" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                           <circle 
                              cx="64" cy="64" r="58" fill="none" stroke="#10b981" strokeWidth="10" 
                              strokeDasharray={2 * Math.PI * 58} 
                              strokeDashoffset={2 * Math.PI * 58 * (1 - totalTasksCompleted / (tasks.length || 1))}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-2xl font-black text-slate-900">{Math.round((totalTasksCompleted / (tasks.length || 1)) * 100)}%</span>
                        </div>
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('analytics.completionRate')}</p>
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full relative overflow-hidden group">
            {!isPro && (
              <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8 text-center transition-all opacity-0 group-hover:opacity-100">
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-50 max-w-[200px]">
                  <Lock size={24} className="text-indigo-500 mx-auto mb-3" />
                  <p className="text-xs text-slate-600 mb-4">{t('pricing.limitations.advanced')}</p>
                  <button 
                    onClick={onNavigateToPricing}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {t('common.goPro')}
                  </button>
                </div>
              </div>
            )}
            
            <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
               <Trophy size={20} className="text-indigo-500" />
               {t('analytics.consistency')}
            </h3>
            <div className={`space-y-8 transition-all ${!isPro ? 'filter grayscale opacity-40 select-none' : ''}`}>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-2">{t('analytics.habitStrength')}</p>
                  {habits.length === 0 ? (
                    <p className="text-xs text-slate-300 italic">No habits tracking...</p>
                  ) : (
                    habits.map(habit => {
                      const dayLimit = period === 'day' ? 1 : period === 'week' ? 7 : 30;
                      const completionsInPeriod = habit.completedDates.length; 
                      const percentage = Math.min(Math.round((completionsInPeriod / dayLimit) * 100), 100);
                      return (
                        <div key={habit.id} className="group/item">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="font-black text-slate-700 truncate max-w-[120px]">{habit.title}</span>
                            <span className="text-indigo-600 font-black">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                            <div 
                              className="bg-indigo-500 h-full rounded-full transition-all duration-1000 group-hover/item:bg-indigo-600" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
               </div>

               <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 pb-2">{t('analytics.focusDist')}</p>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-slate-300 italic">No focus sessions yet.</p>
                  ) : (
                    <div className="space-y-3">
                       {Array.from(new Set(sessions.map(s => s.goalTitle))).slice(0, 3).map(title => {
                          const time = sessions.filter(s => s.goalTitle === title).reduce((acc, s) => acc + s.durationMinutes, 0);
                          const total = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
                          const pct = Math.round((time / total) * 100);
                          return (
                            <div key={title} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                               <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{title}</span>
                               <span className="text-[10px] font-black text-slate-400">{time}m ({pct}%)</span>
                            </div>
                          )
                       })}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
