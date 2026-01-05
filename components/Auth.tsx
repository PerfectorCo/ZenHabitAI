
import React from 'react';
import { Timer, Sparkles, LogIn } from 'lucide-react';

interface AuthProps {
  onLogin: (provider: 'google' | 'facebook') => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const handleLogin = (provider: 'google' | 'facebook') => {
    setIsLoading(provider);
    // Simulate OAuth Redirect/Popup delay
    setTimeout(() => {
      onLogin(provider);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
              <Timer size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">ZenHabit AI</h1>
            <p className="text-slate-400 leading-relaxed">
              Your personalized journey to mindfulness and productivity starts here. 
              Sign in to sync your habits to the cloud.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-4 px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-70"
            >
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              )}
              Continue with Google
            </button>

            <button
              onClick={() => handleLogin('facebook')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold py-4 px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-70"
            >
              {isLoading === 'facebook' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              Continue with Facebook
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          By continuing, you agree to our <span className="text-slate-400 underline cursor-pointer">Terms of Service</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
