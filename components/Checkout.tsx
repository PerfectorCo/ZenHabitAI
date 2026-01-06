
import React from 'react';
import { ArrowLeft, ShieldCheck, CreditCard, Mail, Wallet, Smartphone, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface CheckoutProps {
  onConfirm: () => void;
  onCancel: () => void;
  plan: 'pro' | 'master';
  userEmail: string;
}

type BillingCycle = 'monthly' | 'yearly';
type PaymentMethod = 'momo' | 'zalopay' | 'card' | 'applepay' | 'googlepay';

const Checkout: React.FC<CheckoutProps> = ({ onConfirm, onCancel, plan, userEmail }) => {
  const { t, language } = useLanguage();
  const [cycle, setCycle] = React.useState<BillingCycle>('monthly');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('card');

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

  // Localized payment options
  const paymentOptions = language === 'vi' 
    ? [
        { id: 'momo' as PaymentMethod, label: 'MoMo', icon: Wallet, color: 'text-pink-500 bg-pink-50' },
        { id: 'zalopay' as PaymentMethod, label: 'ZaloPay', icon: Smartphone, color: 'text-blue-500 bg-blue-50' },
        { id: 'card' as PaymentMethod, label: 'Thẻ ATM / Visa / Mastercard', icon: CreditCard, color: 'text-slate-600 bg-slate-50' }
      ]
    : [
        { id: 'card' as PaymentMethod, label: 'Credit / Debit Card', icon: CreditCard, color: 'text-slate-600 bg-slate-50' },
        { id: 'applepay' as PaymentMethod, label: 'Apple Pay', icon: Globe, color: 'text-black bg-slate-100' },
        { id: 'googlepay' as PaymentMethod, label: 'Google Pay', icon: Smartphone, color: 'text-blue-600 bg-blue-50' }
      ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-5 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Left side: Information */}
      <div className="lg:col-span-3 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {language === 'vi' ? 'Hoàn tất đăng ký.' : 'Complete your path.'}
          </h1>
          <p className="text-slate-500 italic font-light leading-relaxed">
            {language === 'vi' 
              ? 'Mọi thay đổi lớn lao đều bắt đầu từ một lựa chọn nhỏ.' 
              : 'Every great transformation begins with a single choice.'}
          </p>
        </header>

        {/* Account Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Mail size={12} />
            {language === 'vi' ? 'Tài khoản thanh toán' : 'Payment Account'}
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm">
            <span className="font-bold text-slate-700">{userEmail}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
              {language === 'vi' ? 'Tự động' : 'Auto-filled'}
            </span>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <CreditCard size={12} />
            {language === 'vi' ? 'Phương thức thanh toán' : 'Payment Method'}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${
                    paymentMethod === opt.id 
                      ? 'border-indigo-600 bg-indigo-50/30' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{opt.label}</span>
                  </div>
                  {paymentMethod === opt.id && (
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold uppercase tracking-widest pt-4"
        >
          <ArrowLeft size={16} />
          {language === 'vi' ? 'Quay lại' : 'Go back'}
        </button>
      </div>

      {/* Right side: Order Summary */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl sticky top-24 space-y-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-4">
            {language === 'vi' ? 'Chi tiết đơn hàng' : 'Order Summary'}
          </h2>

          {/* Billing Toggle in Summary */}
          <div className="bg-white/5 p-1 rounded-2xl flex items-center border border-white/5">
            <button
              onClick={() => setCycle('monthly')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                cycle === 'monthly' 
                  ? 'bg-white text-indigo-900' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t('common.monthly')}
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                cycle === 'yearly' 
                  ? 'bg-white text-indigo-900' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t('common.yearly')}
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">ZenHabit {plan === 'pro' ? 'Pro' : 'Master'}</p>
                <p className="text-white/40 text-xs">
                  {cycle === 'monthly' ? (language === 'vi' ? 'Thanh toán mỗi tháng' : 'Monthly billing') : (language === 'vi' ? 'Thanh toán mỗi năm' : 'Yearly billing')}
                </p>
              </div>
              <p className="font-black text-indigo-400">{getPrice()}</p>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex justify-between font-black text-xl">
                <span>{language === 'vi' ? 'Tổng cộng' : 'Total'}</span>
                <span>{getPrice()}</span>
              </div>
              <p className="text-[10px] text-white/30 italic text-center">
                {language === 'vi' 
                  ? '* Gói đăng ký tự động gia hạn. Bạn có thể hủy bất cứ lúc nào trong cài đặt.' 
                  : '* Subscription renews automatically. You can cancel anytime in settings.'}
              </p>
            </div>
          </div>

          <button
            onClick={onConfirm}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
          >
            <ShieldCheck size={24} />
            {language === 'vi' ? 'Thanh toán ngay' : 'Pay Now'}
          </button>

          <div className="flex items-center justify-center gap-2 opacity-30 text-[9px] font-black uppercase tracking-[0.2em]">
            <CreditCard size={12} />
            Secure Encrypted Payment
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
