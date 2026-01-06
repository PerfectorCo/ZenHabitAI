
import React from 'react';
// Add Sparkles to the lucide-react imports
import { ArrowLeft, ShieldCheck, CreditCard, Mail, Wallet, Smartphone, Globe, Loader2, Check, Sparkles } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processStep, setProcessStep] = React.useState(0);

  const isVi = language === 'vi';

  const prices = {
    monthly: { vi: '79.000đ', en: '$3.99' },
    yearly: { vi: '790.000đ', en: '$39.99' },
    savings: { vi: 'Tiết kiệm 158.000đ (2 tháng)', en: 'Save $7.89 (2 months free)' }
  };

  const getPrice = () => {
    if (plan === 'master') return isVi ? 'Sắp ra mắt' : 'Coming soon';
    return cycle === 'monthly' ? prices.monthly[language] : prices.yearly[language];
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    // Simulate multi-step production payment processing
    setTimeout(() => setProcessStep(1), 800);  // Encrypting
    setTimeout(() => setProcessStep(2), 1600); // Contacting Provider
    setTimeout(() => {
      onConfirm();
    }, 2500);
  };

  const paymentOptions = isVi 
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

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto py-32 px-6 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-indigo-50 rounded-full animate-spin border-t-indigo-600" />
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
            <ShieldCheck size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {isVi ? 'Đang xử lý thanh toán...' : 'Processing payment...'}
          </h2>
          <p className="text-slate-400 text-sm font-medium animate-pulse">
            {processStep === 0 && (isVi ? 'Đang mã hóa dữ liệu bảo mật' : 'Encrypting secure data')}
            {processStep === 1 && (isVi ? 'Đang kết nối với nhà cung cấp' : 'Connecting to payment provider')}
            {processStep === 2 && (isVi ? 'Đang hoàn tất giao dịch' : 'Finalizing transaction')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Checkout Content */}
      <div className="lg:col-span-7 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isVi ? 'Xác nhận đăng ký' : 'Confirm Subscription'}
          </h1>
          <p className="text-slate-500 italic font-light leading-relaxed">
            {isVi 
              ? 'Tham gia cùng hàng ngàn người dùng đang xây dựng kỷ luật tự thân.' 
              : 'Join thousands of users building sustainable self-discipline.'}
          </p>
        </header>

        {/* User Email Info */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Mail size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isVi ? 'Tài khoản ZenHabit' : 'ZenHabit Account'}</p>
            <p className="font-bold text-slate-800">{userEmail}</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 pl-2">
            {isVi ? 'Chọn phương thức thanh toán' : 'Select Payment Method'}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${
                    isActive 
                      ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100/50 -translate-y-1' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${opt.color}`}>
                      <Icon size={24} />
                    </div>
                    <span className="font-bold text-slate-700">{opt.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                    {isActive && <Check size={14} strokeWidth={4} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          {isVi ? 'Quay lại' : 'Go back'}
        </button>
      </div>

      {/* Summary Panel */}
      <div className="lg:col-span-5">
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl sticky top-24 space-y-10 overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40 border-b border-white/5 pb-6">
              {isVi ? 'Chi tiết đơn hàng' : 'Order Details'}
            </h2>

            {/* Cycle Selector */}
            <div className="grid grid-cols-2 bg-white/5 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setCycle('monthly')}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  cycle === 'monthly' ? 'bg-white text-indigo-900 shadow-lg' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t('common.monthly')}
              </button>
              <button
                onClick={() => setCycle('yearly')}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  cycle === 'yearly' ? 'bg-white text-indigo-900 shadow-lg' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t('common.yearly')}
                <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[8px] px-2 py-0.5 rounded-full ring-2 ring-slate-900 animate-bounce">
                  -20%
                </span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-xl">ZenHabit {plan === 'pro' ? 'Pro' : 'Master'}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {cycle === 'monthly' ? (isVi ? 'Thanh toán mỗi tháng' : 'Billed monthly') : (isVi ? 'Thanh toán mỗi năm' : 'Billed yearly')}
                  </p>
                </div>
                <p className="font-black text-2xl text-indigo-400">{getPrice()}</p>
              </div>

              {cycle === 'yearly' && (
                <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center gap-2">
                  <Sparkles size={14} />
                  {prices.savings[language]}
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/10 space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-white/60 text-sm font-bold">{isVi ? 'Thành tiền' : 'Grand Total'}</span>
                <span className="text-3xl font-black">{getPrice()}</span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handlePayNow}
                  className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/60 hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <ShieldCheck size={20} />
                  {isVi ? 'Thanh toán ngay' : 'Subscribe Now'}
                </button>
                <p className="text-[10px] text-white/30 italic text-center leading-relaxed">
                  {isVi 
                    ? 'Bằng cách nhấn thanh toán, bạn đồng ý với Điều khoản dịch vụ. Có thể hủy bất cứ lúc nào.' 
                    : 'By subscribing, you agree to our Terms of Service. Cancel at any moment in settings.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 opacity-30">
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
              <ShieldCheck size={12} /> SSL Secure
            </div>
            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
              <Globe size={12} /> Global Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
