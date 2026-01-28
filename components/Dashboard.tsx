
import React from 'react';
import { Sparkles, CheckCircle2, Flame, Clock, PlusCircle, Check, RefreshCw, Leaf, BarChart3, AlertCircle } from 'lucide-react';
import {
  Habit,
  Task,
  Recommendation,
  UserProfile,
  StoredAIRecommendations,
  UserProfileContext,
  HabitSummary,
  ActivitySnapshot,
  ZenSenseiInsight,
} from '../types';
import { getAtomicHabitRecommendations, getZenSenseiInsight } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../LanguageContext';
import { StorageService } from '../services/storageService';

interface DashboardProps {
  habits: Habit[];
  tasks: Task[];
  profile: UserProfile;
  onAddHabit: (title: string, category: string) => void;
}

const RECS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const Dashboard: React.FC<DashboardProps> = ({ habits, tasks, profile, onAddHabit }) => {
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [loadingAI, setLoadingAI] = React.useState(true);
  const [aiIsReflecting, setAiIsReflecting] = React.useState(false);
  const [addedIds, setAddedIds] = React.useState<number[]>([]);
  const [zenInsight, setZenInsight] = React.useState<ZenSenseiInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = React.useState(false);
  const { t, language } = useLanguage();

  const buildProfileContext = React.useCallback((): UserProfileContext => {
    return {
      id: profile.email || 'anonymous',
      name: profile.name,
      language,
      mainGoal: profile.mainGoal,
      identityDescription: profile.bio,
    };
  }, [profile, language]);

  const buildHabitSummaries = React.useCallback((): HabitSummary[] => {
    return habits.map((h) => ({
      id: h.id,
      title: h.title,
      category: h.category,
      completedDates: h.completedDates,
      streak: h.streak,
      targetCount: h.targetCount,
      timeSpentMinutes: h.timeSpentMinutes,
    }));
  }, [habits]);

  const buildActivitySnapshot = React.useCallback((): ActivitySnapshot => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const allCompletionDates = habits.flatMap((h) => h.completedDates);
    const recentCompletions = allCompletionDates.filter((d) => d >= sevenDaysAgo.toISOString().split('T')[0]).length;

    const lastCompletion = allCompletionDates.length
      ? allCompletionDates.reduce((latest, d) => (d > latest ? d : latest), allCompletionDates[0])
      : null;

    let inactivityDays = 0;
    if (lastCompletion) {
      const lastDate = new Date(lastCompletion);
      const diffMs = today.getTime() - lastDate.getTime();
      inactivityDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } else {
      inactivityDays = 30;
    }

    return {
      recentCompletions,
      focusMinutesLast7Days: 0,
      inactivityDays,
    };
  }, [habits]);

  const fetchRecs = React.useCallback(async (forceRefresh = false) => {
    setLoadingAI(true);
    setAiIsReflecting(false);

    if (!forceRefresh) {
      const stored = StorageService.getStoredAIRecommendations();
      if (stored) {
        const isStale = Date.now() - new Date(stored.timestamp).getTime() > RECS_CACHE_TTL;
        const goalChanged = stored.mainGoal !== profile.mainGoal;
        const langChanged = stored.language !== language;

        if (!isStale && !goalChanged && !langChanged) {
          setRecommendations(stored.recommendations);
          setLoadingAI(false);
          return;
        }
      }
    }

    try {
      const ctx: UserProfileContext = buildProfileContext();
      const habitSummaries = buildHabitSummaries();
      const activity = buildActivitySnapshot();
      const atomic = await getAtomicHabitRecommendations({
        profile: ctx,
        habits: habitSummaries,
        activity,
        lang: language === 'vi' ? 'vi' : 'en',
      });

      const mapped: Recommendation[] = (atomic.recommendations || []).map((rec) => ({
        title: rec.title,
        reason: rec.explanation,
        priority: rec.priority,
        suggestedHabit: {
          title: rec.microAction,
          category: profile.mainGoal || 'Mindset',
        },
      }));

      setRecommendations(mapped);

      const newCache: StoredAIRecommendations = {
        recommendations: mapped,
        timestamp: new Date().toISOString(),
        mainGoal: profile.mainGoal,
        language: language,
      };
      StorageService.saveAIRecommendations(newCache);
    } catch (error) {
      console.warn('Atomic Habits recommendations fallback', error);
      setAiIsReflecting(true);
      const fallbacks = getStaticFallbacks(profile.mainGoal || '', language === 'vi' ? 'vi' : 'en');
      setRecommendations(fallbacks);
    } finally {
      setLoadingAI(false);
    }
  }, [buildActivitySnapshot, buildHabitSummaries, buildProfileContext, language, profile.mainGoal]);

  React.useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  React.useEffect(() => {
    const loadInsight = async () => {
      setLoadingInsight(true);
      try {
        const ctx = buildProfileContext();
        const activity = buildActivitySnapshot();
        const insight = await getZenSenseiInsight({
          profile: ctx,
          activity,
          insightType: 'daily',
          lang: language === 'vi' ? 'vi' : 'en',
        });
        setZenInsight(insight);
      } catch (error) {
        console.warn('Zen Sensei insight fallback', error);
        setZenInsight(null);
      } finally {
        setLoadingInsight(false);
      }
    };

    loadInsight();
  }, [buildActivitySnapshot, buildProfileContext, language]);

  const handleAddSuggestedHabit = (rec: Recommendation, index: number) => {
    if (rec.suggestedHabit) {
      onAddHabit(rec.suggestedHabit.title, rec.suggestedHabit.category);
      setAddedIds([...addedIds, index]);
    }
  };

  const completedTodayCount = habits.filter(h =>
    h.completedDates.some(d => d.split('T')[0] === new Date().toISOString().split('T')[0])
  ).length;

  const chartData = habits.slice(0, 5).map(h => ({
    name: h.title,
    completions: h.completedDates.length
  }));

  const mainGoalText = profile.mainGoal || t('profile.goals.prod');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {t('dashboard.welcome')}
        </h1>
        <p className="text-slate-500">{t('dashboard.focusForToday')}: <span className="text-indigo-600 font-medium">{mainGoalText}</span></p>
      </header>


      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-indigo-100 font-medium mb-1">{t('dashboard.progress')}</h3>
            <div className="text-4xl font-bold mb-4">{completedTodayCount}/{habits.length}</div>
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
        <section className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={20} />
              {aiIsReflecting ? (language === 'vi' ? 'Trí tuệ vượt thời gian' : 'Timeless Wisdom') : t('dashboard.aiRecs')}
            </h2>
            <button
              onClick={() => fetchRecs(true)}
              disabled={loadingAI}
              className="p-2 transition-all disabled:opacity-50 text-indigo-600 hover:scale-110"
              title="Refresh recommendations"
            >
              <RefreshCw size={18} className={loadingAI ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-4">
            {aiIsReflecting && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <Leaf size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 font-medium italic">
                  {language === 'vi'
                    ? "Zen Sensei đang chiêm nghiệm. Đây là những lời khuyên vượt thời gian dành cho bạn."
                    : "The Zen Sensei is reflecting. Here is some timeless wisdom for your journey."}
                </p>
              </div>
            )}

            {loadingAI ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : recommendations.length === 0 ? (
               <div className="p-10 text-center text-slate-400 italic text-sm">Every day is a new beginning...</div>
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
                        {aiIsReflecting ? (language === 'vi' ? 'Lời khuyên' : 'Wisdom') : t('dashboard.aiRecs')}
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

        <section className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-emerald-500" size={18} />
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                {language === 'vi' ? 'Zen Sensei' : 'Zen Sensei'}
              </h2>
            </div>
            {loadingInsight ? (
              <div className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
            ) : zenInsight ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  {zenInsight.title}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {zenInsight.message}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {language === 'vi'
                  ? 'Mỗi ngày là một cơ hội để quay lại với những thói quen nhỏ.'
                  : 'Each day is a chance to gently return to your smallest habits.'}
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[260px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="text-indigo-500" size={18} />
                {t('dashboard.aiInsights')}
              </h3>
            </div>
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <BarChart3 size={40} className="text-slate-300 mb-4 opacity-30" />
                <p className="text-slate-400 font-medium text-sm">
                  {language === 'vi'
                    ? 'Chưa có dữ liệu thói quen để hiển thị. Hãy bắt đầu thêm thói quen của bạn!'
                    : 'No habit data to display yet. Start adding your habits!'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="completions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
