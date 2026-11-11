import React from 'react';

/**
 * High-fidelity pure SVG Moon Phases
 * Renders an array of moon phases (New -> Crescent -> Quarter -> Gibbous -> Full -> Gibbous -> Quarter -> Crescent)
 */
export const MoonPhaseStrip: React.FC<{ className?: string; size?: number; glowColor?: string }> = ({
  className = '',
  size = 18,
  glowColor = 'rgba(111, 168, 255, 0.4)',
}) => {
  // 7 standard phase representations using SVG masks
  return (
    <div
      className={`inline-flex items-center justify-center gap-3 select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Waxing Crescent */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="opacity-60 hover:opacity-100 transition-opacity">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
        <path d="M12 2 A10 10 0 0 1 20 12 A10 10 0 0 1 12 22 A7 10 0 0 0 12 2 Z" fill="currentColor" />
      </svg>

      {/* 2. First Quarter */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="opacity-75 hover:opacity-100 transition-opacity">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
        <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="currentColor" />
      </svg>

      {/* 3. Waxing Gibbous */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="opacity-85 hover:opacity-100 transition-opacity">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M12 2 A10 10 0 0 1 12 22 A6 10 0 0 0 12 2 Z" fill="currentColor" />
      </svg>

      {/* 4. Full Moon (Glowing Center) */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-xs"
          style={{ backgroundColor: glowColor, transform: 'scale(1.4)' }}
        />
        <svg width={size + 4} height={size + 4} viewBox="0 0 24 24" className="relative text-white fill-current">
          <circle cx="12" cy="12" r="10" />
          {/* Subtle crater details */}
          <circle cx="9" cy="8" r="2.2" fill="currentColor" fillOpacity="0.18" />
          <circle cx="15" cy="14" r="2.8" fill="currentColor" fillOpacity="0.18" />
          <circle cx="14" cy="7" r="1.5" fill="currentColor" fillOpacity="0.15" />
          <circle cx="8" cy="15" r="1.8" fill="currentColor" fillOpacity="0.15" />
        </svg>
      </div>

      {/* 5. Waning Gibbous */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="opacity-85 hover:opacity-100 transition-opacity">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M12 2 A10 10 0 0 0 12 22 A6 10 0 0 1 12 2 Z" fill="currentColor" />
      </svg>

      {/* 6. Last Quarter */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="opacity-75 hover:opacity-100 transition-opacity">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
        <path d="M12 2 A10 10 0 0 0 12 22 Z" fill="currentColor" />
      </svg>

      {/* 7. Waning Crescent */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="opacity-60 hover:opacity-100 transition-opacity">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
        <path d="M12 2 A10 10 0 0 0 4 12 A10 10 0 0 0 12 22 A7 10 0 0 1 12 2 Z" fill="currentColor" />
      </svg>
    </div>
  );
};

/**
 * Large Glowing Monochrome Moon with a vertical blue beam of light (세로 글로우)
 */
export const RadiantNightMoon: React.FC<{ size?: number; className?: string }> = ({
  size = 110,
  className = '',
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} aria-hidden="true">
      {/* Vertical Blue Light Beam (세로 글로우 포인트 한 줄) */}
      <div
        className="absolute w-[2px] h-[340px] pointer-events-none -top-16 opacity-75 animate-pulse"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(111, 168, 255, 0.85) 40%, rgba(47, 91, 234, 0.95) 55%, transparent)',
          boxShadow: '0 0 18px rgba(111, 168, 255, 0.7), 0 0 40px rgba(47, 91, 234, 0.5)',
        }}
      />

      {/* Radiant Aura around moon */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 1.6,
          height: size * 1.6,
          background: 'radial-gradient(circle, rgba(220, 233, 255, 0.28) 0%, rgba(47, 91, 234, 0.15) 50%, transparent 75%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Moon Disc */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="relative drop-shadow-[0_0_25px_rgba(220,233,255,0.4)]"
      >
        <defs>
          <radialGradient id="moonSurface" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E6EDF8" />
            <stop offset="85%" stopColor="#CBD7EB" />
            <stop offset="100%" stopColor="#9FB3D6" />
          </radialGradient>
          <filter id="moonCraterShade" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base Moon Sphere */}
        <circle cx="50" cy="50" r="46" fill="url(#moonSurface)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="0.5" />

        {/* Lunar Seas & Craters */}
        <g filter="url(#moonCraterShade)" fill="#7E93B5" fillOpacity="0.22">
          {/* Mare Imbrium */}
          <ellipse cx="36" cy="34" rx="13" ry="11" transform="rotate(-15 36 34)" />
          {/* Mare Serenitatis */}
          <circle cx="58" cy="32" r="9" />
          {/* Mare Tranquillitatis */}
          <ellipse cx="64" cy="48" rx="11" ry="8" transform="rotate(25 64 48)" />
          {/* Oceanus Procellarum edge */}
          <ellipse cx="28" cy="54" rx="10" ry="14" transform="rotate(10 28 54)" />
          {/* Tycho crater rays */}
          <circle cx="50" cy="76" r="3.5" fill="#FFFFFF" fillOpacity="0.5" />
          <circle cx="50" cy="76" r="2" fill="#586E91" fillOpacity="0.4" />
          {/* Copernicus */}
          <circle cx="38" cy="46" r="2.8" fill="#586E91" fillOpacity="0.35" />
          {/* Kepler */}
          <circle cx="26" cy="44" r="1.8" fill="#586E91" fillOpacity="0.3" />
        </g>

        {/* Crescent shadow line for artistic depth */}
        <path
          d="M 50 4 A 46 46 0 0 1 50 96 A 40 46 0 0 0 50 4 Z"
          fill="#0B1F4B"
          fillOpacity="0.12"
        />
      </svg>
    </div>
  );
};
