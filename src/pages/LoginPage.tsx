import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../router';
import { OWNER_WHITELIST_EMAIL } from '../firebase';
import { ShieldCheck, LogIn, LogOut, ArrowLeft, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, isOwner, authError, clearAuthError, loginWithGoogle, logout } = useAuth();
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage = authError || localError;

  const handleLogin = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      clearAuthError();
      await loginWithGoogle();
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '로그인 처리 중 문제가 발생했습니다.';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Minimal Editorial Card */}
        <div className="paper-sheet p-6 sm:p-8 border border-[rgba(11,31,75,0.14)] shadow-sm">
          {/* Section title (location name only) */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#0B1F4B] tracking-tight">
              로그인
            </h1>
          </div>

          {/* Access Denied or Error Notice */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50/90 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {user && isOwner ? (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-[#DCE9FF]/40 border border-[#2F5BEA]/20 text-xs">
                <p className="text-[#0B1F4B]/60 mb-1">관리자 계정으로 로그인됨</p>
                <p className="font-mono text-[#1D3FBB] font-semibold truncate">{user.email}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-2.5 bg-[#0B1F4B] text-white text-xs font-medium hover:bg-[#1D3FBB] transition-colors"
                >
                  홈으로 이동
                </button>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2.5 border border-[rgba(11,31,75,0.2)] text-[#0B1F4B] text-xs font-medium hover:bg-white/80 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#0B1F4B] text-white text-sm font-medium tracking-tight hover:bg-[#1D3FBB] transition-colors disabled:opacity-50 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? '로그인 중...' : 'Google 계정으로 로그인'}</span>
              </button>

              <p className="text-center text-[11px] text-[#0B1F4B]/40 font-light">
                주인 계정({OWNER_WHITELIST_EMAIL})만 로그인 가능합니다.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 text-xs text-[#0B1F4B]/50 hover:text-[#0B1F4B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>홈으로 돌아가기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
