
import React from 'react';
import { Sparkles, CheckCircle2, Flame, Clock, PlusCircle, Check } from 'lucide-react';
import { Habit, Task, Recommendation, UserProfile } from '../types';
import { getAIRecommendations } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../LanguageContext';

interface DashboardProps {
  habits: Habit[];
  tasks: Task[];
  profile: UserProfile;
  onAddHabit: (title: string, category: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ habits, tasks, profile, onAddHabit }) => {
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [loadingAI, setLoadingAI] = React.useState(true);
  const [addedIds, setAddedIds] = React.useState<number[]>([]);
  const { t, language } = useLanguage();

  React.useEffect(() => {
    const fetchRecs = async () => {
      setLoadingAI(true);
      const recs = await getAIRecommendations(habits, profile, language);
      setRecommendations(recs);
      setLoadingAI(false);
    };
    fetchRecs();
  }, [language]); 

  const handleAddSuggestedHabit = (rec: Recommendation, index: number) => {
    if (rec.suggestedHabit) {
      onAddHabit(rec.suggestedHabit.title, rec.suggestedHabit.category);
      setAddedIds([...addedIds, index]);
    }
  };

  const completedToday = habits.filter(h => 
    h.completedDates.some(d => d.split('T')[0] === new Date().toISOString().split('T')[0])
  ).length;

  const chartData = habits.slice(0, 5).map(h => ({
    name: h.title,
    completions: h.completedDates.length
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {t('dashboard.welcome')}, {profile.name.split(' ')[0]}!
        </h1>
        <p className="text-slate-500">{t('dashboard.focusForToday')}: <span className="text-indigo-600 font-medium">{profile.mainGoal}</span></p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-indigo-100 font-medium mb-1">{t('dashboard.progress')}</h3>
            <div className="text-4xl font-bold mb-4">{completedToday}/{habits.length}</div>
            <p className="text-sm text-indigo-200">{t('dashboard.progressSub')}</p>
          </div>
          <CheckCircle2 className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">{t('dashboard.longestStreak')}</h3>
            <div className="text-2xl font-bold text-slate-900">
              {habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0} {t('common.days')}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">{t('dashboard.totalActions')}</h3>
            <div className="text-2xl font-bold text-slate-900">
              {habits.reduce((acc, h) => acc + h.completedDates.length, 0)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={20} />
              {t('dashboard.aiRecs')}
            </h2>
          </div>
          <div className="space-y-4">
            {loadingAI ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : (
              recommendations.map((rec, i) => (
                <div key={i} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all cursor-default relative overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{rec.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rec.priority === 'high' ? 'bg-red-50 text-red-500' :
                      rec.priority === 'medium' ? 'bg-amber-50 text-amber-500' :
                      'bg-emerald-50 text-emerald-500'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{rec.reason}</p>
                  
                  {rec.suggestedHabit && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                        {t('dashboard.aiRecs')}
                      </div>
                      {addedIds.includes(i) ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                          <Check size={14} /> {t('dashboard.addedToList')}
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAddSuggestedHabit(rec, i)}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <PlusCircle size={14} /> {t('dashboard.addToList')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">{t('dashboard.aiInsights')}</h2>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="completions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
