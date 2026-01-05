
import React from 'react';
import { Send, MessageSquare, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { StorageService } from '../services/storageService';
import { FeedbackSubmission } from '../types';

const Feedback: React.FC = () => {
  const { t, language } = useLanguage();
  const [type, setType] = React.useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    const submission: FeedbackSubmission = {
      id: Date.now().toString(),
      userId: StorageService.getUserId(),
      type,
      message,
      timestamp: new Date().toISOString()
    };

    try {
      await StorageService.saveFeedback(submission);
      setSubmitted(true);
      setMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('feedback.success')}</h2>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
        >
          {t('common.ok')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">{t('feedback.header')}</h1>
        <p className="text-slate-500">{t('feedback.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="space-y-4">
          <label className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-500" /> {t('feedback.typeLabel')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['bug', 'suggestion', 'other'] as const).map((tValue) => (
              <button
                key={tValue}
                type="button"
                onClick={() => setType(tValue)}
                className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-2 ${
                  type === tValue
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                {tValue === 'bug' && <AlertCircle size={20} />}
                {tValue === 'suggestion' && <Sparkles size={20} />}
                {tValue === 'other' && <MessageSquare size={20} />}
                {t(`feedback.types.${tValue}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs uppercase font-black tracking-widest text-slate-400">
            {t('feedback.messageLabel')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedback.messagePlh')}
            required
            className="w-full h-40 px-5 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none font-medium text-slate-700"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
            {t('common.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Feedback;
