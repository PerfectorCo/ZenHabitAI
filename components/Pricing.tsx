
import React from 'react';
import { Check, Sparkles, Heart, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Pricing: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24 px-4">
      <header className="text-center space-y-6 pt-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          {t('pricing.page.title')}
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light italic">
          "{t('pricing.page.subtitle')}"
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {/* Free Plan */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col hover:border-slate-200 transition-all duration-500">
          <div className="mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">
              {t('pricing.plans.free.tagline')}
            </span>
            <h2 className="text-3xl font-bold text-slate-900">{t('pricing.plans.free.name')}</h2>
          </div>
          
          <p className="text-slate-500 text-sm mb-12 leading-relaxed min-h-[48px]">
            {t('pricing.plans.free.description')}
          </p>

          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-50 pb-2">
              Features
            </p>
            <ul className="space-y-4 mb-12">
              {t('pricing.plans.free.features').map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mt-0.5">
                    <Check size={12} />
                  </div>
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <button className="w-full py-4 px-6 rounded-[1.2rem] bg-slate-50 text-slate-900 font-bold hover:bg-slate-100 transition-all active:scale-[0.98]">
            {t('pricing.plans.free.cta')}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-100 flex flex-col relative overflow-hidden group transition-all duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2 block">
                {t('pricing.plans.pro.tagline')}
              </span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold">{t('pricing.plans.pro.name')}</h2>
                <span className="text-indigo-200 text-xs font-medium">{t('pricing.plans.pro.price')}</span>
              </div>
            </div>
            
            <p className="text-indigo-100 text-sm mb-12 leading-relaxed min-h-[48px]">
              {t('pricing.plans.pro.description')}
            </p>

            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/50 mb-6 border-b border-white/10 pb-2">
                Everything in Free, plus
              </p>
              <ul className="space-y-4 mb-12">
                {t('pricing.plans.pro.features').map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-indigo-50">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-indigo-300 mt-0.5">
                      <Check size={12} />
                    </div>
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="w-full py-4 px-6 rounded-[1.2rem] bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-all shadow-lg active:scale-[0.98]">
              {t('pricing.plans.pro.cta')}
            </button>
          </div>
        </div>

        {/* Zen Master (Coming Soon) */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group border-dashed opacity-80 hover:opacity-100 transition-all duration-500">
           <div className="absolute top-4 right-4 bg-violet-100 text-violet-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {t('pricing.plans.master.status')}
           </div>
           
           <div className="mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">
              {t('pricing.plans.master.tagline')}
            </span>
            <h2 className="text-3xl font-bold text-slate-900">{t('pricing.plans.master.name')}</h2>
          </div>
          
          <p className="text-slate-500 text-sm mb-12 leading-relaxed min-h-[48px]">
            {t('pricing.plans.master.description')}
          </p>

          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-6 border-b border-slate-50 pb-2">
              Path to mastery
            </p>
            <ul className="space-y-4 mb-12">
              {t('pricing.plans.master.features').map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center text-violet-300 mt-0.5">
                    <Clock size={12} />
                  </div>
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <button disabled className="w-full py-4 px-6 rounded-[1.2rem] bg-slate-50 text-slate-300 font-bold cursor-not-allowed">
            {t('pricing.plans.master.cta')}
          </button>
        </div>
      </div>

      <footer className="max-w-2xl mx-auto text-center space-y-6 pt-12 pb-20">
        <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
          <Heart size={28} className="text-indigo-500 fill-indigo-50/50" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">{t('pricing.closing.title')}</h3>
        <p className="text-slate-500 text-base leading-relaxed italic max-w-lg mx-auto">
          "{t('pricing.closing.message')}"
        </p>
      </footer>
    </div>
  );
};

export default Pricing;
