import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

// Known medical and scientific acronyms to preserve in uppercase
const PRESERVED_ACRONYMS = new Set([
  'EVA', 'LGPD', 'FDA', 'WPI', 'DAS28', 'PSA', 'ACR', 'PUBMED', 'FAERS', 
  'PDB', 'CID', 'NCT', 'HAQ', 'CDAI', 'SDAI', 'BASDAI', 'ASDAS', 'SLEDAI', 
  'ASAS', 'HRV', 'MTX', 'FC', 'S.O.S', 'SOS', 'AI', 'IA', 'API', 'REST', 'NIH', 'NLM'
]);

export function toSentenceCase(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/(\s+|[-/])/);
  let isFirstWord = true;

  return words
    .map((word) => {
      if (/^\s+$/.test(word) || word === '-' || word === '/') {
        return word;
      }
      const upper = word.toUpperCase().replace(/[.,;:!?()]/g, '');
      if (PRESERVED_ACRONYMS.has(upper)) {
        return word.toUpperCase();
      }
      if (isFirstWord) {
        isFirstWord = false;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join('');
}

interface TooltipProps {
  content: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  children,
  position = 'top',
  className = '',
  maxWidth = 'max-w-xs sm:max-w-sm'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };
    if (isVisible) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isVisible]);

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position];

  const formattedTitle = typeof title === 'string' ? toSentenceCase(title) : title;
  const formattedContent = typeof content === 'string' && !title && content.length < 60 ? toSentenceCase(content) : content;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <div
        onClick={() => setIsVisible((prev) => !prev)}
        className="inline-flex items-center cursor-help"
        tabIndex={0}
        role="button"
        aria-expanded={isVisible}
      >
        {children}
      </div>

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50 ${maxWidth} w-max p-2.5 sm:p-3 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[11px] sm:text-xs font-normal rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md leading-relaxed animate-in fade-in zoom-in-95 pointer-events-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {formattedTitle && (
            <div className="font-bold text-teal-400 dark:text-teal-300 pb-1 mb-1 border-b border-slate-700/60 flex items-center gap-1.5">
              <span>{formattedTitle}</span>
            </div>
          )}
          <div className="text-slate-200 dark:text-slate-300">
            {formattedContent}
          </div>
        </div>
      )}
    </div>
  );
};

interface InfoTooltipProps {
  title?: string;
  content: React.ReactNode;
  icon?: 'help' | 'info';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  ariaLabel?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  content,
  icon = 'help',
  size = 'md',
  position = 'top',
  className = '',
  ariaLabel
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  const IconComponent = icon === 'info' ? Info : HelpCircle;

  return (
    <Tooltip
      title={title}
      content={content}
      position={position}
      className={className}
    >
      <span
        className="p-1 rounded-full text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/40 inline-flex items-center justify-center cursor-pointer select-none"
        aria-label={ariaLabel || title || 'Mais informações'}
      >
        <IconComponent className={sizeClasses} />
      </span>
    </Tooltip>
  );
};
