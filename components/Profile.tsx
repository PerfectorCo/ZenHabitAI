
import React from 'react';
import { User, Mail, Target, Save, Cloud, LogOut, Bell, ShieldCheck, ShieldAlert, Plus, Edit3, X, Check, Trash2, Link2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../LanguageContext';
import { StorageService } from '../services/storageService';

interface ProfileProps {
  profile: UserProfile;
  isGuest?: boolean;
  onSave: (profile: UserProfile) => void;
  onLogout: () => void;
  onConnectAccount?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, isGuest, onSave, onLogout, onConnectAccount }) => {
  const [formData, setFormData] = React.useState({
    ...profile,
    customGoalOptions: profile.customGoalOptions || [],
    hiddenStandardGoals: profile.hiddenStandardGoals || []
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [showCustomGoalInput, setShowCustomGoalInput] = React.useState(false);
  const [customGoalText, setCustomGoalText] = React.useState('');
  const { t, language } = useLanguage();

  React.useEffect(() => {
    if (isGuest) {
      StorageService.trackEvent('guest_profile_connect_shown');
    }
  }, [isGuest]);

  const [notifPermission, setNotifPermission] = React.useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "default"
  );

  const standardGoalsPool = [
    { id: 'prod', label: t('profile.goals.prod') || 'Improve productivity' },
    { id: 'fitness', label: t('profile.goals.fitness') || 'Physical fitness' },
    { id: 'mental', label: t('profile.goals.mental') || 'Mental health' },
    { id: 'learning', label: t('profile.goals.learning') || 'Learning skills' }
  ];

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 800);
  };

  const selectGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      mainGoal: goal
    }));
  };

  const addCustomGoalOption = () => {
    const text = customGoalText.trim();
    if (text) {
      setFormData(prev => {
        const alreadyInOptions = prev.customGoalOptions.includes(text);
        return {
          ...prev,
          customGoalOptions: alreadyInOptions ? prev.customGoalOptions : [...prev.customGoalOptions, text],
          mainGoal: text
        };
      });
      setCustomGoalText('');
      setShowCustomGoalInput(false);
    }
  };

  const removeCustomOptionFromPool = (label: string) => {
    setFormData(prev => ({
      ...prev,
      customGoalOptions: prev.customGoalOptions.filter(g => g !== label),
      mainGoal: prev.mainGoal === label ? '' : prev.mainGoal
    }));
  };

  const removeStandardGoalFromPool = (id: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      hiddenStandardGoals: [...prev.hiddenStandardGoals, id],
      mainGoal: prev.mainGoal === label ? '' : prev.mainGoal
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('profile.header')}</h1>
          <p className="text-slate-500">{t('profile.subtitle')}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-colors"
        >
          <LogOut size={18} />
          {t('profile.signOut')}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center justify-center pb-8 border-b border-slate-50">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-100">
              {formData.name.charAt(0)}
            </div>
            <div className="absolute inset-0 rounded-[2rem] bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-xs font-bold text-white uppercase tracking-widest">Change</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> {t('profile.fullName')}
            </label>
            <input
              type="text"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
              <Mail size={14} className="text-indigo-500" /> {t('profile.email')}
            </label>
            <input
              type="email"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-400"
              value={formData.email}
              readOnly
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
            <Target size={14} className="text-indigo-500" /> {t('profile.focusArea')}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Standard Goals Pool */}
            {standardGoalsPool.filter(sg => !formData.hiddenStandardGoals.includes(sg.id)).map(goal => (
              <div
                key={goal.id}
                className={`flex items-center justify-between p-1 rounded-2xl border-2 transition-all group ${
                  formData.mainGoal === goal.label
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectGoal(goal.label)}
                  className="flex-1 text-sm font-bold py-3 pl-4 text-left truncate"
                >
                  {goal.label}
                </button>
                <div className="flex items-center gap-2 pr-2">
                  {formData.mainGoal === goal.label && <Check size={14} />}
                  <button
                    type="button"
                    onClick={() => removeStandardGoalFromPool(goal.id, goal.label)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-50 hover:bg-red-500 rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all shadow-sm"
                    title="Remove option"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Custom options pool */}
            {formData.customGoalOptions.map((g, i) => (
               <div
                key={i}
                className={`p-1 pl-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  formData.mainGoal === g
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectGoal(g)}
                  className="flex-1 text-sm font-bold py-3 text-left truncate pr-2"
                >
                  {g}
                </button>
                <div className="flex items-center gap-2 pr-2">
                  {formData.mainGoal === g && <Check size={14} />}
                  <button
                    type="button"
                    onClick={() => removeCustomOptionFromPool(g)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-50 hover:bg-red-500 rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all shadow-sm"
                    title="Remove option"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showCustomGoalInput && (
            <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <input
                type="text"
                placeholder={t('onboarding.customGoalPlh')}
                className="w-full px-5 py-4 rounded-2xl bg-white border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700"
                value={customGoalText}
                onChange={e => setCustomGoalText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomGoalOption()}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowCustomGoalInput(false); setCustomGoalText(''); }} className="text-xs font-bold text-slate-400">Cancel</button>
                <button type="button" onClick={addCustomGoalOption} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Add & Select</button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCustomGoalInput(true)}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 text-sm font-bold transition-all text-left flex items-center gap-2 hover:border-indigo-200"
          >
            <Plus size={16} />
            {t('profile.customGoal')}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase font-black tracking-widest text-slate-400">{t('profile.bio')}</label>
          <textarea
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none font-medium text-slate-700"
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            placeholder={t('profile.bioPlh')}
          />
        </div>

        <div className="pt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {t('common.save')}
          </button>
        </div>
      </form>

      {isGuest && (
        <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 border border-indigo-100 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
            <Link2 size={28} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900">{t('profile.connectAccount')}</h3>
            <p className="text-sm text-slate-500">{t('profile.connectSubtitle')}</p>
          </div>
          <button
            onClick={() => {
              StorageService.trackEvent('guest_profile_connect_clicked');
              onConnectAccount?.();
            }}
            className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
          >
            {t('profile.connectAccount')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
