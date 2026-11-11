import React from 'react';
import { useRouter, Link } from '../router';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldCheck, LogOut, Home } from 'lucide-react';

export const Header: React.FC = () => {
  const { path, navigate } = useRouter();
  const { user, isOwner, logout } = useAuth();

  // Exactly 5 section navigation items (Notices & Talks removed as requested)
  const navItems = [
    { label: '영상', href: '/videos' },
    { label: '노래', href: '/songs' },
    { label: '캐릭터', href: '/characters' },
    { label: '비하인드 스토리', href: '/stories' },
    { label: '익명 질문함', href: '/questions' },
  ];

  const isCurrent = (href: string) => {
    if (href === '/characters') {
      return path.startsWith('/characters');
    }
    if (href === '/stories') {
      return path.startsWith('/stories');
    }
    return path === href;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F6EFE3]/90 backdrop-blur-md border-b border-[rgba(11,31,75,0.1)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Home link icon if not on home */}
        <div className="flex items-center">
          {path !== '/' ? (
            <Link
              to="/"
              className="text-[#0B1F4B]/60 hover:text-[#0B1F4B] transition-colors p-1.5 -ml-1.5 mr-4 sm:mr-8 rounded hover:bg-[rgba(11,31,75,0.05)]"
              aria-label="홈으로 이동"
            >
              <Home className="w-4 h-4" />
            </Link>
          ) : (
            <span className="w-1 mr-2" />
          )}

          {/* Section Names Only (영상 / 노래 / 캐릭터 / 비하인드 스토리 / 익명 질문함) */}
          <nav className="flex items-center space-x-5 sm:space-x-8 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => {
              const active = isCurrent(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`relative text-sm sm:text-base tracking-tight whitespace-nowrap transition-colors py-1.5 ${
                    active
                      ? 'text-[#0B1F4B] font-semibold'
                      : 'text-[#0B1F4B]/65 hover:text-[#0B1F4B] font-normal'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D3FBB] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Login status display - small "로그아웃" text link in the top corner */}
        <div className="flex items-center space-x-2 text-xs">
          {user && isOwner ? (
            <button
              onClick={() => logout()}
              className="text-xs text-[#0B1F4B]/65 hover:text-[#1D3FBB] transition-colors underline underline-offset-4 py-1 px-1 font-light"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-[#0B1F4B]/35 hover:text-[#0B1F4B] p-1.5 transition-colors text-xs"
              title="로그인"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
