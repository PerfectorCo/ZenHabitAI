
import React from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface PaymentSuccessProps {
  onContinue: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onContinue }) => {
  const { language } = useLanguage();

  return (
    <div className="max-w-xl mx-auto py-24 px-6 flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-1000">
      <div className="relative">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-500 shadow-sm">
          <Heart size={40} className="fill-indigo-500/10" />
        </div>
        <div className="absolute -top-2 -right-2 text-indigo-300">
          <Sparkles size={24} className="animate-pulse" />
        </div>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {language === 'vi' ? 'Hành trình đã rộng mở.' : 'The path is open.'}
        </h1>
        
        <div className="space-y-4 max-w-sm mx-auto">
          <p className="text-slate-600 leading-relaxed font-light italic">
            {language === 'vi' 
              ? 'Bạn đã chọn đi sâu hơn vào con đường của chính mình. Sự cam kết này dành cho bản thân là một bước đi đáng quý.' 
              : 'You have chosen to go deeper into your journey. This commitment to yourself is a thoughtful step.'}
          </p>
          
          <p className="text-slate-400 text-sm leading-relaxed">
            {language === 'vi'
              ? 'Các công cụ mới đã sẵn sàng. Hãy hít một hơi thật sâu và tiếp tục theo nhịp độ của riêng bạn.'
              : 'Your perspective is now enriched with new insights. Take a breath and continue at your own pace.'}
          </p>
        </div>
      </div>

      <div className="w-full pt-8">
        <button
          onClick={onContinue}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {language === 'vi' ? 'Tiếp tục hành trình' : 'Continue the journey'}
        </button>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
        ZenHabit Pro
      </p>
    </div>
  );
};

export default PaymentSuccess;
