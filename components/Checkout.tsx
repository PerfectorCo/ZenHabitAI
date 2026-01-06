
import React from 'react';
import { ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface CheckoutProps {
  onConfirm: () => void;
  onCancel: () => void;
  plan: 'pro' | 'master';
}

type BillingCycle = 'monthly' | 'yearly';

const Checkout: React.FC<CheckoutProps> = ({ onConfirm, onCancel, plan }) => {
  const { t, language } = useLanguage();
  const [cycle, setCycle] = React.useState<BillingCycle>('monthly');

  const getPrice = () => {
    if (plan === 'master') return language === 'vi' ? 'Sắp ra mắt' : 'Coming soon';
    
    if (cycle === 'monthly') {
      return language === 'vi' ? '79.000đ' : '$3.99';
    } else {
      return language === 'vi' ? '790.000đ' : '$39.99';
    }
  };

  const getDurationLabel = () => {
    if (plan === 'master') return '';
    return cycle === 'monthly' 
      ? ` / ${language === 'vi' ? 'tháng' : 'month'}` 
      : ` / ${language === 'vi' ? 'năm' : 'year'}`;
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {language === 'vi' ? 'Đi sâu hơn vào hành trình.' : 'Deepening the path.'}
        </h1>
        <p className="text-slate-500 italic font-light leading-relaxed">
          {language === 'vi' 
            ? 'Một không gian tĩnh lặng cho sự rõ ràng và góc nhìn mới.' 
            : 'A quiet space for clarity and perspective.'}
        </p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-10">
        {/* Minimalist Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-slate-50 p-1 rounded-2xl flex items-center border border-slate-100">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                cycle === 'monthly' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('common.monthly')}
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                cycle === 'yearly' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('common.yearly')}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600 leading-relaxed text-center max-w-[280px] mx-auto">
            {language === 'vi'
              ? 'Gói đăng ký này hỗ trợ sự phát triển của bạn và có thể dừng lại bất cứ khi nào bạn muốn.'
              : 'This subscription supports your growth and can be ended at any moment.'}
          </p>
          <div className="pt-6 text-center">
             <span className="text-4xl font-bold text-indigo-600">
               {getPrice()}
             </span>
             <span className="text-slate-400 text-sm font-medium ml-2">{getDurationLabel()}</span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-50">
          <button
            onClick={onConfirm}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <ShieldCheck size={24} />
            {language === 'vi' ? 'Xác nhận hành trình.' : 'Confirm the journey.'}
          </button>
          
          <button
            onClick={onCancel}
            className="w-full py-3 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            {language === 'vi' ? 'Quay về trạng thái cân bằng.' : 'Return to balance.'}
          </button>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-6 opacity-30">
        <div className="flex items-center gap-2">
          <CreditCard size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Secure Payment</span>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
