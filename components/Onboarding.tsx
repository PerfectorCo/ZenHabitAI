
import React from 'react';
import { Sparkles, ArrowRight, User, Target, Bookmark, Check, Plus, X, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../LanguageContext';

interface OnboardingProps {
  onComplete: (data: Partial<UserProfile>) => void;
  userEmail: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userEmail }) => {
  const [step, setStep] = React.useState(1);
  const { t, language } = useLanguage();
  const [formData, setFormData] = React.useState({
    name: '',
    mainGoal: '',
    customGoalOptions: [] as string[],
    hiddenStandardGoals: [] as string[],
    bio: ''
  });
  const [showCustomGoalInput, setShowCustomGoalInput] = React.useState(false);
  const [customGoalText, setCustomGoalText] = React.useState('');

  const standardGoals = [
    { id: 'prod', icon: '⚡', label: language === 'vi' ? 'Nâng cao năng suất' : 'Improve productivity' },
    { id: 'fitness', icon: '💪', label: language === 'vi' ? 'Thể chất khỏe mạnh' : 'Physical fitness' },
    { id: 'mental', icon: '🧘', label: language === 'vi' ? 'Sức khỏe tinh thần' : 'Mental health' },
    { id: 'learning', icon: '📚', label: language === 'vi' ? 'Học kỹ năng mới' : 'Learning skills' }
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete({
        ...formData,
        email: userEmail,
        joinedDate: new Date().toISOString(),
        onboardingCompleted: true
      });
    }
  };

  const selectGoal = (label: string) => {
    setFormData(prev => ({
      ...prev,
      mainGoal: label
    }));
  };

  const handleCustomGoalSubmit = () => {
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

  const removeCustomOption = (label: string) => {
    setFormData(prev => ({
      ...prev,
      customGoalOptions: prev.customGoalOptions.filter(g => g !== label),
      mainGoal: prev.mainGoal === label ? '' : prev.mainGoal
    }));
  };

  const removeStandardGoal = (id: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      hiddenStandardGoals: [...prev.hiddenStandardGoals, id],
      mainGoal: prev.mainGoal === label ? '' : prev.mainGoal
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <User size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              {language === 'vi' ? 'Chúng tôi nên gọi bạn là gì?' : 'What should we call you?'}
            </h2>
            <p className="text-slate-500 text-lg">
              {language === 'vi' ? 'Hãy bắt đầu với tên của bạn để ZenHabit có thể cá nhân hóa trải nghiệm.' : 'Let\'s start with your name so ZenHabit can personalize your experience.'}
            </p>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'vi' ? 'Nhập tên của bạn...' : 'Enter your name...'}
              autoFocus
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-xl font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
            />
          </div>
        );
      case 2:
        const visibleStandardGoals = standardGoals.filter(g => !formData.hiddenStandardGoals.includes(g.id));
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-6">
              <Target size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              {language === 'vi' ? 'Trọng tâm chính của bạn là gì?' : 'What is your main focus?'}
            </h2>
            <p className="text-slate-500 text-lg">
              {language === 'vi' ? 'Chọn mục tiêu quan trọng nhất. Bạn có thể xóa các tùy chọn không cần thiết.' : 'Select your top goal. You can delete any options you don\'t need.'}
            </p>
            
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar pb-4">
              {visibleStandardGoals.map((goal) => (
                <div 
                  key={goal.id}
                  className={`flex items-center justify-between p-1 rounded-2xl border-2 transition-all group ${
                    formData.mainGoal === goal.label
                      ? 'bg-indigo-50 border-indigo-500 shadow-md'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <button 
                    onClick={() => selectGoal(goal.label)}
                    className="flex-1 flex items-center gap-4 p-4 text-left"
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="text-lg font-bold text-slate-800">{goal.label}</span>
                  </button>
                  <div className="flex items-center gap-2 pr-4">
                    {formData.mainGoal === goal.label && (
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                    <button 
                      onClick={() => removeStandardGoal(goal.id, goal.label)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-50 hover:bg-red-500 rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all shadow-sm"
                      title="Remove option"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {formData.customGoalOptions.map((customGoal, idx) => (
                <div 
                  key={`custom-${idx}`}
                  className={`flex items-center justify-between p-1 rounded-2xl border-2 transition-all group ${
                    formData.mainGoal === customGoal
                      ? 'bg-indigo-50 border-indigo-500 shadow-md'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}
                >
                   <button 
                    onClick={() => selectGoal(customGoal)}
                    className="flex-1 flex items-center gap-4 p-4 text-left"
                   >
                    <span className="text-2xl">✨</span>
                    <span className="text-lg font-bold text-slate-800">{customGoal}</span>
                  </button>
                  <div className="flex items-center gap-2 pr-4">
                    {formData.mainGoal === customGoal && (
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    )}
                    <button 
                      onClick={() => removeCustomOption(customGoal)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-50 hover:bg-red-500 rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all shadow-sm"
                      title="Remove option"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {!showCustomGoalInput ? (
                <button
                  onClick={() => setShowCustomGoalInput(true)}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-slate-400 hover:text-indigo-600 font-bold"
                >
                  <Plus size={24} />
                  {t('onboarding.customGoal')}
                </button>
              ) : (
                <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-white space-y-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    value={customGoalText}
                    onChange={(e) => setCustomGoalText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomGoalSubmit()}
                    placeholder={t('onboarding.customGoalPlh')}
                    autoFocus
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowCustomGoalInput(false); setCustomGoalText(''); }} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase">Cancel</button>
                    <button onClick={handleCustomGoalSubmit} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg uppercase tracking-wider shadow-md shadow-indigo-100">Add & Select</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Bookmark size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              {language === 'vi' ? 'Một chút về bản thân bạn?' : 'Tell us a bit about yourself?'}
            </h2>
            <p className="text-slate-500 text-lg">
              {language === 'vi' ? 'Chia sẻ ngắn gọn về động lực hoặc phong cách sống của bạn.' : 'Share a brief note about your motivation or lifestyle.'}
            </p>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={language === 'vi' ? 'vd: Tôi muốn xây dựng thói quen đọc sách mỗi ngày...' : 'e.g. I want to build a reading habit every day...'}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-lg font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none h-40 resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.mainGoal.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-50 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-50 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-indigo-600' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        <div className="mt-12 flex items-center justify-between sticky bottom-0 bg-white/80 backdrop-blur-sm py-4">
          <div className="flex items-center gap-2 text-slate-400">
             <Sparkles size={16} className="text-indigo-400 animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-widest">{language === 'vi' ? 'Thiết lập AI Cá nhân' : 'AI Personal Setup'}</span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            {step === 3 ? (language === 'vi' ? 'Bắt đầu ngay' : 'Get Started') : (language === 'vi' ? 'Tiếp tục' : 'Continue')}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
