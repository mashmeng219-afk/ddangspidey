import React from 'react';

/**
 * TornPaperDivider:
 * Beautiful irregular torn paper boundary that connects two sections.
 * Displays cream paper (#F6EFE3) torn edge revealing blue paper (Royal/Cobalt) underneath.
 */
export const TornPaperDivider: React.FC<{
  position?: 'top' | 'bottom';
  className?: string;
  revealingBlue?: boolean;
}> = ({ position = 'bottom', className = '', revealingBlue = true }) => {
  return (
    <div
      className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{ height: '42px', marginTop: position === 'top' ? '-1px' : '0', marginBottom: position === 'bottom' ? '-1px' : '0' }}
      aria-hidden="true"
    >
      {/* Background layer: Blue paper peek */}
      {revealingBlue && (
        <svg
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full text-[#1D3FBB]"
        >
          {/* Deep ink/blue paper layer with subtle texture */}
          <path
            d="M 0 0 L 1200 0 L 1200 24 Q 1050 16 900 28 Q 750 36 600 22 Q 450 12 300 26 Q 150 34 0 20 Z"
            fill="currentColor"
            fillOpacity="0.88"
          />
          <path
            d="M 0 0 L 1200 0 L 1200 16 Q 1080 24 920 18 Q 720 12 560 22 Q 360 30 200 14 L 0 18 Z"
            fill="#2F5BEA"
            fillOpacity="0.75"
          />
        </svg>
      )}

      {/* Foreground layer: Torn Cream Paper with jagged fibers */}
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="relative w-full h-full text-[#F6EFE3] drop-shadow-[0_4px_6px_rgba(11,31,75,0.08)]"
      >
        {/* Jagged realistic paper tear path */}
        <path
          d="M 0 40 L 1200 40 L 1200 14 
             L 1180 16 L 1160 12 L 1140 17 L 1115 13 L 1090 18 L 1070 14 L 1045 19 L 1020 15 L 995 21 L 970 16 
             L 945 22 L 920 17 L 895 23 L 870 16 L 845 20 L 820 15 L 795 22 L 770 17 L 745 23 L 720 16 
             L 695 22 L 670 15 L 645 21 L 620 16 L 595 22 L 570 17 L 545 23 L 520 15 L 495 21 L 470 16 
             L 445 22 L 420 17 L 395 23 L 370 15 L 345 21 L 320 16 L 295 22 L 270 17 L 245 23 L 220 15 
             L 195 21 L 170 16 L 145 22 L 120 17 L 95 23 L 70 15 L 45 21 L 20 16 L 0 18 Z"
          fill="currentColor"
        />
        {/* Fine paper fiber edge line */}
        <path
          d="M 0 18 Q 150 16 300 21 Q 450 15 600 22 Q 750 17 900 23 Q 1050 16 1200 14"
          fill="none"
          stroke="rgba(11, 31, 75, 0.08)"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
      </svg>
    </div>
  );
};

/**
 * Inverted Torn Paper Edge (For transitioning into dark sections like videos/night)
 */
export const InvertedTornPaperDivider: React.FC<{
  className?: string;
  fillColor?: string;
}> = ({ className = '', fillColor = '#0B1F4B' }) => {
  return (
    <div
      className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{ height: '36px' }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 36"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ color: fillColor }}
      >
        <path
          d="M 0 0 L 1200 0 L 1200 24 
             L 1175 19 L 1150 25 L 1120 18 L 1090 24 L 1060 17 L 1030 23 L 1000 18 L 970 24 L 940 17 
             L 910 23 L 880 18 L 850 24 L 820 17 L 790 23 L 760 18 L 730 24 L 700 17 L 670 23 L 640 18 
             L 610 24 L 580 17 L 550 23 L 520 18 L 490 24 L 460 17 L 430 23 L 400 18 L 370 24 L 340 17 
             L 310 23 L 280 18 L 250 24 L 220 17 L 190 23 L 160 18 L 130 24 L 100 17 L 70 23 L 40 18 L 0 24 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

/**
 * SpeechBubble Component for Q&A
 * - type='question': Dark Charcoal / Ink Navy paper with left speech tail
 * - type='answer': Vivid Royal/Cobalt Blue paper with subtle glow
 */
export const PaperSpeechBubble: React.FC<{
  type: 'question' | 'answer';
  children: React.ReactNode;
  className?: string;
}> = ({ type, children, className = '' }) => {
  const isQuestion = type === 'question';

  return (
    <div
      className={`relative p-4 sm:p-5 transition-all duration-300 ${
        isQuestion
          ? 'bg-[#18233C] text-[#F6EFE3] border border-[rgba(255,255,255,0.12)] shadow-md rounded-tr-lg rounded-br-lg rounded-bl-lg rounded-tl-xs'
          : 'bg-gradient-to-r from-[#1D3FBB] to-[#2F5BEA] text-white border border-[#6FA8FF]/30 shadow-md rounded-tl-lg rounded-bl-lg rounded-br-lg rounded-tr-xs'
      } ${className}`}
    >
      {/* Speech bubble tail indicator */}
      {isQuestion ? (
        <span
          className="absolute -top-2 left-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#18233C]"
          aria-hidden="true"
        />
      ) : (
        <span
          className="absolute -top-2 right-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#2F5BEA]"
          aria-hidden="true"
        />
      )}

      {/* Analog paper grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '4px 4px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
