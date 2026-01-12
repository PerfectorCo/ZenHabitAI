
import React from 'react';
import { Timer } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../LanguageContext';

interface AuthProps {
  onLoginSuccess: (userId: string) => void;
  hideGuest?: boolean;
  minimal?: boolean;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, hideGuest = false, minimal = false }) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string>('');
  const [emailSent, setEmailSent] = React.useState<boolean>(false);

  const isVi = language === 'vi';

  const copy = {
    title: isVi ? 'Tiếp tục cùng ZenHabit' : 'Continue with ZenHabit',
    subtitle: isVi
      ? 'Bạn có thể dùng thử ngay, sau đó tùy chọn lưu lại hành trình của mình.'
      : 'You can start using ZenHabit now, and decide later if you want to save your progress.',
    guestLabel: isVi ? 'Vào ngay không cần tài khoản' : 'Continue without an account',
    guestHelper: isVi
      ? 'Bắt đầu trải nghiệm đầy đủ trên thiết bị này, có thể đăng nhập sau nếu bạn muốn.'
      : 'Start a full experience on this device, with the option to sign in later if you wish.',
    emailLabel: isVi ? 'Gửi liên kết đăng nhập qua email' : 'Send a sign-in link to my email',
    emailHelper: isVi
      ? 'Khi bạn muốn lưu và tiếp tục hành trình trên nhiều thiết bị, chỉ cần nhập email để nhận liên kết mở lại.'
      : 'When you’d like to keep your journey across devices, enter your email to receive a link to reopen it.',
    googleLabel: isVi ? 'Tiếp tục với Google' : 'Continue with Google',
    googleHelper: isVi
      ? 'Lựa chọn bổ sung cho người đang dùng tài khoản Google và muốn đăng nhập nhanh.'
      : 'An additional option for those already using a Google account and who prefer a quick sign-in.',
    postLoginNote: isVi
      ? 'Bạn có thể đăng xuất bất cứ lúc nào. Dữ liệu thói quen vẫn được giữ lại cho lần quay lại tiếp theo.'
      : 'You can sign out at any time. Your habit data will be kept for when you return.'
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError(
        isVi
          ? 'Supabase chưa được cấu hình. Vui lòng thiết lập SUPABASE_URL và SUPABASE_ANON_KEY.'
          : 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.'
      );
      return;
    }

    setIsLoading('google');
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (authError) {
        let errorMessage = authError.message;

        if (authError.message?.includes('provider is not enabled')) {
          console.error('Google OAuth provider is not enabled in Supabase:', authError);
          errorMessage = isVi
            ? 'Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại sau.'
            : 'Unable to sign in with Google right now. Please try again later.';
        } else if (authError.message?.includes('validation_failed')) {
          console.error('Google OAuth validation failed. Please verify Supabase OAuth configuration:', authError);
          errorMessage = isVi
            ? 'Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại sau.'
            : 'Unable to sign in with Google right now. Please try again later.';
        }

        setError(errorMessage);
        setIsLoading(null);
        return;
      }
    } catch (e: any) {
      let errorMessage = isVi
        ? 'Đăng nhập không thành công. Vui lòng thử lại.'
        : 'Login failed. Please try again.';

      if (e?.message?.includes('provider is not enabled')) {
        console.error('Google OAuth provider is not enabled in Supabase:', e);
        errorMessage = isVi
          ? 'Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại sau.'
          : 'Unable to sign in with Google right now. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      setIsLoading(null);
    }
  };

  const handleEmailLogin = async () => {
    if (!supabase) {
      console.error('Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
      setError(
        isVi
          ? 'Không thể gửi liên kết đăng nhập lúc này. Vui lòng thử lại sau.'
          : 'Unable to send the sign-in link right now. Please try again later.'
      );
      return;
    }

    if (!email) {
      setError(isVi ? 'Vui lòng nhập email của bạn.' : 'Please enter your email.');
      return;
    }

    setIsLoading('email');
    setError(null);
    setEmailSent(false);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(null);
        return;
      }

      setEmailSent(true);
    } catch (e: any) {
      const fallback = isVi
        ? 'Không thể gửi liên kết đăng nhập. Vui lòng thử lại.'
        : 'Could not send the sign-in link. Please try again.';
      setError(e?.message || fallback);
    } finally {
      setIsLoading(null);
    }
  };

  const handleGuestContinue = () => {
    onLoginSuccess('guest-user');
  };

  const content = (
    <div className={`${minimal ? '' : 'max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700'}`}>
      <div className={`bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl ${minimal ? 'bg-slate-800/80' : ''}`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
            <Timer size={32} />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            {copy.title}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        <div className="space-y-6">
          {!hideGuest && (
            <>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGuestContinue}
                  className="w-full flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white py-4 px-6 transition-all active:scale-95"
                >
                  <span className="font-semibold">{copy.guestLabel}</span>
                  <span className="mt-1 text-xs text-slate-300">{copy.guestHelper}</span>
                </button>
              </div>

              <div className="h-px bg-white/10" />
            </>
          )}

          <div className="space-y-3">
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-white">{copy.emailLabel}</span>
              <span className="text-xs text-slate-300">{copy.emailHelper}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isVi ? 'you@example.com' : 'you@example.com'}
                className="flex-1 rounded-2xl bg-slate-900/40 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={isLoading === 'email'}
                className="sm:w-40 w-full inline-flex items-center justify-center rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-4 py-3 transition-all active:scale-95 disabled:opacity-70"
              >
                {isLoading === 'email'
                  ? (isVi ? 'Đang gửi...' : 'Sending...')
                  : isVi
                    ? 'Gửi liên kết'
                    : 'Send link'}
              </button>
            </div>
            {emailSent && (
              <p className="text-xs text-emerald-300 mt-1">
                {isVi
                  ? 'Đã gửi liên kết đăng nhập. Vui lòng kiểm tra hộp thư của bạn.'
                  : 'Sign-in link sent. Please check your inbox.'}
              </p>
            )}
          </div>

          {supabase && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-white">{copy.googleLabel}</span>
                <span className="text-xs text-slate-300">{copy.googleHelper}</span>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading === 'google'}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold py-3.5 px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-70"
              >
                {isLoading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    className="w-5 h-5"
                    alt="Google"
                  />
                )}
                {copy.googleLabel}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-200 text-xs text-center leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      </div>

      {!minimal && (
        <div className="mt-6 space-y-2 text-center">
          <p className="text-slate-400 text-xs">{copy.postLoginNote}</p>
        </div>
      )}
    </div>
  );

  if (minimal) return content;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      {content}
    </div>
  );
};

export default Auth;
