import React from 'react';

interface RitmaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'with-icon' | 'compact' | 'icon-only';
  showTagline?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

// Standalone gradient MM wave symbol
export const RitmaSymbolMM: React.FC<{ className?: string }> = ({ className = 'w-16 h-8' }) => {
  const gradientId = React.useId();
  return (
    <svg
      viewBox="0 0 126 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#1FBCC4" />
          <stop offset="45%" stopColor="#3975E3" />
          <stop offset="100%" stopColor="#9251E5" />
        </linearGradient>
      </defs>
      
      {/* Continuous Wave MM Graph */}
      <path
        d="M 8 42 C 16 42, 24 12, 34 12 C 44 12, 48 38, 56 38 C 64 38, 68 12, 78 12 C 86 12, 94 36, 102 30 L 116 10"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Solid Violet Dot at Top Right Peak */}
      <circle cx="116" cy="10" r="5.5" fill="#9251E5" />
    </svg>
  );
};

// Rounded Square App Icon with Grid and Wave MM Graph
export const RitmaLogoIcon: React.FC<{ className?: string; size?: string }> = ({
  className = 'w-10 h-10'
}) => {
  const gradientId = React.useId();
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#062B63] to-[#041D45] p-2 shadow-lg shadow-[#062B63]/25 text-white shrink-0 overflow-hidden border border-[#1FBCC4]/20 ${className}`}
    >
      {/* Background subtle vertical grid lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex justify-around px-2">
        <div className="w-[1px] h-full bg-cyan-400/40" />
        <div className="w-[1px] h-full bg-cyan-400/40" />
        <div className="w-[1px] h-full bg-cyan-400/40" />
        <div className="w-[1px] h-full bg-cyan-400/40" />
        <div className="w-[1px] h-full bg-cyan-400/40" />
        <div className="w-[1px] h-full bg-cyan-400/40" />
        <div className="w-[1px] h-full bg-cyan-400/40" />
      </div>

      <svg
        viewBox="0 0 126 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#24C4D1" />
            <stop offset="45%" stopColor="#4C7FE8" />
            <stop offset="100%" stopColor="#9854E8" />
          </linearGradient>
        </defs>

        {/* Faint Grid Lines in SVG */}
        <line x1="20" y1="10" x2="20" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="36" y1="10" x2="36" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="52" y1="10" x2="52" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="68" y1="10" x2="68" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="84" y1="10" x2="84" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="100" y1="10" x2="100" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Wave MM Path */}
        <path
          d="M 12 56 C 20 56, 28 22, 38 22 C 48 22, 52 48, 60 48 C 68 48, 72 22, 82 22 C 90 22, 98 44, 104 38 L 115 18"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top Right Violet Dot */}
        <circle cx="115" cy="18" r="6.5" fill="#9854E8" />
      </svg>
    </div>
  );
};

export const RitmaLogo: React.FC<RitmaLogoProps> = ({
  size = 'md',
  variant = 'full',
  showTagline = true,
  showSubtitle = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-24 h-24 rounded-3xl'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  const symbolSizes = {
    sm: 'w-10 h-5',
    md: 'w-14 h-7',
    lg: 'w-20 h-10',
    xl: 'w-32 h-16'
  };

  const subtitleSizes = {
    sm: 'text-[9px] tracking-[0.2em]',
    md: 'text-[11px] tracking-[0.22em]',
    lg: 'text-[13px] tracking-[0.25em]',
    xl: 'text-[16px] tracking-[0.28em]'
  };

  const sloganSizes = {
    sm: 'text-[7.5px] tracking-[0.22em]',
    md: 'text-[9.5px] tracking-[0.25em]',
    lg: 'text-[12px] tracking-[0.28em]',
    xl: 'text-[15px] tracking-[0.3em]'
  };

  if (variant === 'icon-only') {
    return <RitmaLogoIcon className={iconSizes[size]} />;
  }

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Top Header Row with Optional App Icon + Brand Name */}
      <div className="flex items-center gap-3">
        {variant === 'with-icon' && <RitmaLogoIcon className={iconSizes[size]} />}

        <div className="flex flex-col items-center">
          {/* Main Title: RIT + [MM Wave] + A */}
          <div className={`font-bold tracking-widest leading-none flex items-center font-sans text-[#062B63] dark:text-slate-100 ${textSizes[size]}`}>
            <span className="font-semibold text-[#062B63] dark:text-white">RIT</span>
            <RitmaSymbolMM className={symbolSizes[size]} />
            <span className="font-semibold text-[#062B63] dark:text-white">A</span>
          </div>

          {/* Subtitle with side lines: — diário de dor — */}
          {showSubtitle && (
            <div className={`flex items-center justify-center gap-2 w-full mt-1.5 text-[#062B63] dark:text-slate-300 font-medium ${subtitleSizes[size]}`}>
              <span className="h-[1px] w-6 bg-[#8795AA]/50 dark:bg-slate-700 inline-block" />
              <span className="lowercase font-normal">diário de dor</span>
              <span className="h-[1px] w-6 bg-[#8795AA]/50 dark:bg-slate-700 inline-block" />
            </div>
          )}

          {/* Slogan: RASTREIE • ENTENDA • CONTROLE */}
          {showTagline && (
            <div className={`flex items-center justify-center gap-1.5 mt-1.5 font-bold uppercase ${sloganSizes[size]}`}>
              <span className="text-[#1FBCC4] dark:text-[#24C4D1]">RASTREIE</span>
              <span className="text-[#3975E3] font-bold">•</span>
              <span className="text-[#3975E3] dark:text-[#4C7FE8]">ENTENDA</span>
              <span className="text-[#9251E5] font-bold">•</span>
              <span className="text-[#9251E5] dark:text-[#9854E8]">CONTROLE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
