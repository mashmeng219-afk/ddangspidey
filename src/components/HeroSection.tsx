import React, { useState, useEffect, useRef } from 'react';
import { NoticeItem, SingleTalkDoc } from '../types';
import { TornPaperDivider } from './TornPaper';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  latestNotice: NoticeItem | undefined;
  singleTalk: SingleTalkDoc;
  onNavigateNotice: (noticeId: string) => void;
  onScrollToTalk: () => void;
  onScrollToArchive: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  latestNotice,
  singleTalk,
  onNavigateNotice,
  onScrollToTalk,
  onScrollToArchive,
}) => {
  // Mouse 3D perspective parallax for central note
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // 3D tilt angles (subtle 2~3 degrees)
  const tiltX = -mouseOffset.y * 3.5;
  const tiltY = mouseOffset.x * 3.5;

  // Extract first line of talk note
  const talkFirstLine = singleTalk?.text ? singleTalk.text.trim().split('\n')[0] : '';

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#FAFAF7] select-none"
    >
      {/* Background: Soft Paper Texture & Noise (SVG feTurbulence filter) */}
      <svg className="hidden" aria-hidden="true">
        <filter id="hero-paper-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.04   0 0 0 0 0.12   0 0 0 0 0.29  0 0 0 0.025 0" />
        </filter>
        <filter id="note-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025 0.035" numOctaves="3" result="rough" />
          <feDisplacementMap in="SourceGraphic" in2="rough" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Subtle paper noise grain layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
        style={{ filter: 'url(#hero-paper-grain)' }}
      />

      {/* Top-left corner label: "home" in italic Quaaykop */}
      <div className="relative z-30 pt-6 px-6 sm:px-10 flex items-center justify-between w-full max-w-7xl mx-auto">
        <span className="font-editorial italic text-xs sm:text-sm tracking-widest text-[#0B1F4B]/50 select-none">
          home
        </span>
        <div className="w-4" />
      </div>

      {/* TOP CENTER GLOWING MOON PHASE MOTIF ORNAMENT (은은한 빛을 내는 달의 위상 변화 모티브 장식) */}
      <div
        className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[180px] sm:w-[220px] h-[34px] sm:h-[40px] pointer-events-none z-15 overflow-visible select-none flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 190 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_8px_rgba(111,168,255,0.42)]"
        >
          <defs>
            {/* Luminous soft halo gradient for the central full moon */}
            <radialGradient id="moonGlowAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6FA8FF" stopOpacity="0.6" />
              <stop offset="45%" stopColor="#2F5BEA" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2F5BEA" stopOpacity="0" />
            </radialGradient>
            {/* Moon body fill gradients */}
            <linearGradient id="fullMoonGradient" x1="95" y1="8" x2="95" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DCE9FF" />
            </linearGradient>
            <linearGradient id="crescentGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2F5BEA" />
              <stop offset="100%" stopColor="#1D3FBB" />
            </linearGradient>
          </defs>

          {/* Tiny celestial constellation accent dots */}
          <circle cx="8" cy="16" r="1" fill="#2F5BEA" opacity="0.35" />
          <circle cx="182" cy="16" r="1" fill="#2F5BEA" opacity="0.35" />
          <path d="M 44 14 Q 44 16 46 16 Q 44 16 44 18 Q 44 16 42 16 Q 44 16 44 14 Z" fill="#6FA8FF" opacity="0.6" />
          <path d="M 146 14 Q 146 16 148 16 Q 146 16 146 18 Q 146 16 144 16 Q 146 16 146 14 Z" fill="#6FA8FF" opacity="0.6" />

          {/* 1. Waxing Crescent (초승달) */}
          <circle cx="27" cy="16" r="6.5" stroke="#1D3FBB" strokeWidth="0.8" fill="none" opacity="0.3" strokeDasharray="1.5 1.5" />
          <path d="M 27 9.5 A 6.5 6.5 0 0 1 33.5 16 A 6.5 6.5 0 0 1 27 22.5 A 4.5 6.5 0 0 0 27 9.5 Z" fill="url(#crescentGrad)" opacity="0.8" />

          {/* 2. First Quarter (상현달) */}
          <circle cx="61" cy="16" r="6.5" stroke="#1D3FBB" strokeWidth="0.8" fill="none" opacity="0.25" />
          <path d="M 61 9.5 A 6.5 6.5 0 0 1 61 22.5 Z" fill="#1D3FBB" opacity="0.85" />

          {/* 3. Full Moon with Ethereal Luminous Glow (보름달 - 중심) */}
          <circle cx="95" cy="16" r="15" fill="url(#moonGlowAura)" />
          <circle cx="95" cy="16" r="7.5" fill="url(#fullMoonGradient)" stroke="#6FA8FF" strokeWidth="0.5" strokeOpacity="0.6" />
          {/* Subtle lunar maria / craters */}
          <circle cx="93" cy="14" r="1.6" fill="#1D3FBB" fillOpacity="0.16" />
          <circle cx="97.5" cy="18" r="1.9" fill="#1D3FBB" fillOpacity="0.16" />
          <circle cx="96" cy="13.5" r="1.1" fill="#1D3FBB" fillOpacity="0.14" />

          {/* 4. Last Quarter (하현달) */}
          <circle cx="129" cy="16" r="6.5" stroke="#1D3FBB" strokeWidth="0.8" fill="none" opacity="0.25" />
          <path d="M 129 9.5 A 6.5 6.5 0 0 0 129 22.5 Z" fill="#1D3FBB" opacity="0.85" />

          {/* 5. Waning Crescent (그믐달) */}
          <circle cx="163" cy="16" r="6.5" stroke="#1D3FBB" strokeWidth="0.8" fill="none" opacity="0.3" strokeDasharray="1.5 1.5" />
          <path d="M 163 9.5 A 6.5 6.5 0 0 0 156.5 16 A 6.5 6.5 0 0 0 163 22.5 A 4.5 6.5 0 0 1 163 9.5 Z" fill="url(#crescentGrad)" opacity="0.8" />
        </svg>
      </div>

      {/* ============================================================ */}
      {/* CENTER COMPOSITION: TYPOGRAPHY (BEHIND) + NOTE (FRONT)       */}
      {/* ============================================================ */}
      <div className="relative my-auto flex items-center justify-center w-full py-8 sm:py-12 px-4">
        <div className="relative w-full max-w-5xl h-[460px] sm:h-[540px] md:h-[600px] flex items-center justify-center">

          {/* -------------------------------------------------------- */}
          {/* LAYER 1 (z-10): TYPOGRAPHY (Placed BEHIND the note)      */}
          {/* -------------------------------------------------------- */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-visible">
            {/* 1. "AI Creator" (Top-Left of note, Pretendard Bold) */}
            <div
              className="absolute left-[3%] sm:left-[8%] md:left-[10%] lg:left-[12%] top-[12%] sm:top-[16%] md:top-[18%] -translate-y-1/2 whitespace-nowrap"
              style={{
                textShadow: '3px 3px 0px #0B1F4B, 5px 6px 14px rgba(11, 31, 75, 0.28)',
              }}
            >
              <span
                className="font-bold text-[#1D3FBB] tracking-tight leading-none text-[clamp(2.8rem,7.5vw,6rem)] select-none"
                style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif" }}
              >
                AI Creator
              </span>
            </div>

            {/* 2. "땅거미" (Bottom-Right of note, Sebang Gothic 2.0 Bold) */}
            <div
              className="absolute right-[2%] sm:right-[6%] md:right-[8%] lg:right-[10%] bottom-[10%] sm:bottom-[14%] md:bottom-[16%] translate-y-1/2 whitespace-nowrap"
              style={{
                textShadow: '3px 4px 0px #0B1F4B, 6px 8px 18px rgba(11, 31, 75, 0.32)',
              }}
            >
              <span
                className="font-sebang font-bold text-[#1D3FBB] tracking-tight leading-none text-[clamp(4.2rem,12vw,9.5rem)] select-none"
              >
                땅거미
              </span>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* LAYER 2 (z-20): REALISTIC PAPER NOTE OBJECT (Center)     */}
          {/* -------------------------------------------------------- */}
          <div
            className="relative z-20 transition-transform duration-200 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(-1.5deg)`,
            }}
          >
            {/* Note Sheet Container: Cream aged paper with 2 horizontal fold lines, blank surface */}
            <div
              className="relative w-[260px] sm:w-[320px] md:w-[360px] aspect-[1/1.42] bg-[#FAF5EC] border border-[rgba(11,31,75,0.14)] rounded-xs overflow-hidden select-none"
              style={{
                boxShadow: `
                  0 2px 4px rgba(11, 31, 75, 0.04),
                  0 8px 16px -2px rgba(11, 31, 75, 0.08),
                  0 24px 44px -8px rgba(11, 31, 75, 0.16),
                  0 40px 70px -12px rgba(11, 31, 75, 0.12),
                  inset 0 0 45px rgba(230, 218, 198, 0.5)
                `,
              }}
            >
              {/* Paper Surface Fiber / Stain Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply"
                style={{ filter: 'url(#hero-paper-grain)' }}
              />

              {/* FOLD LINE 1 (At 33.3% height) */}
              <div
                className="absolute top-[33.3%] left-0 right-0 h-[2px] pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(11, 31, 75, 0.12) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 1px 2px rgba(11, 31, 75, 0.06)',
                }}
              />

              {/* FOLD LINE 2 (At 66.6% height) */}
              <div
                className="absolute top-[66.6%] left-0 right-0 h-[2px] pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(11, 31, 75, 0.12) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 1px 2px rgba(11, 31, 75, 0.06)',
                }}
              />

              {/* Paper Subtle Crease Shading Gradients */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/[0.015] via-60% to-black/[0.03]" />

              {/* Left paper margin shadow (binder impression) */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/[0.04] to-transparent pointer-events-none" />
              {/* Right paper edge highlight */}
              <div className="absolute top-0 bottom-0 right-0 w-1 bg-white/40 pointer-events-none" />
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* LAYER 3 (z-30): 2 PILL SPEECH BUBBLES (Floating)         */}
          {/* -------------------------------------------------------- */}
          {/* Bubble 1: LEFT Royal Blue Pill ("공지사항") */}
          <div className="absolute left-[2%] sm:left-[6%] md:left-[10%] lg:left-[12%] top-[45%] sm:top-[42%] md:top-[40%] -translate-y-1/2 z-30 animate-float-left">
            <button
              type="button"
              onClick={() => {
                if (latestNotice) {
                  onNavigateNotice(latestNotice.id);
                } else {
                  onScrollToArchive();
                }
              }}
              aria-label="공지사항"
              className="group relative cursor-pointer flex items-center justify-center bg-[#1D3FBB] text-white px-5 py-2 sm:px-6 sm:py-3 rounded-full shadow-[0_8px_22px_rgba(29,63,187,0.38)] hover:shadow-[0_14px_30px_rgba(29,63,187,0.52)] hover:scale-105 transition-all duration-300 text-center border border-white/25 active:scale-95"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-tight leading-tight">
                공지사항
              </p>
              {/* Speech Bubble Tail pointing towards the center note */}
              <span
                className="absolute -bottom-1.5 right-6 w-3 h-3 bg-[#1D3FBB] rotate-45 transform pointer-events-none"
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Bubble 2: RIGHT Dark Charcoal Pill ("구상 중...") */}
          <div className="absolute right-[2%] sm:right-[6%] md:right-[10%] lg:right-[12%] bottom-[32%] sm:bottom-[34%] md:bottom-[36%] z-30 animate-float-right">
            <button
              type="button"
              onClick={onScrollToTalk}
              aria-label="구상 중..."
              className="group relative cursor-pointer flex items-center justify-center bg-[#2A2D35] text-white px-5 py-2 sm:px-6 sm:py-3 rounded-full shadow-[0_8px_22px_rgba(0,0,0,0.32)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.45)] hover:scale-105 transition-all duration-300 text-center border border-white/20 active:scale-95"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-tight leading-tight text-white/95">
                구상 중...
              </p>
              {/* Speech Bubble Tail pointing towards the center note */}
              <span
                className="absolute -top-1.5 left-6 w-3 h-3 bg-[#2A2D35] rotate-45 transform pointer-events-none"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HERO BOTTOM: Scroll Down & Torn Paper Divider Boundary        */}
      {/* ============================================================ */}
      <div className="relative z-30 flex flex-col items-center justify-center pt-2">
        <button
          onClick={onScrollToArchive}
          className="group inline-flex flex-col items-center gap-1 text-[11px] text-[#0B1F4B]/60 hover:text-[#0B1F4B] transition-colors cursor-pointer mb-2"
          aria-label="아래로 스크롤하여 아카이브 콘텐츠 보기"
        >
          <span className="font-editorial tracking-widest uppercase text-[10px] text-[#0B1F4B]/50 group-hover:text-[#0B1F4B]">
            Scroll Down
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#1D3FBB]" />
        </button>

        {/* Torn Paper Boundary between White/Cream Hero and Content */}
        <TornPaperDivider position="bottom" revealingBlue={true} />
      </div>
    </section>
  );
};
