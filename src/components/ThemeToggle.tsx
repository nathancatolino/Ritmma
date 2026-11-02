import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Tooltip } from './Tooltip';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('chronos_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('chronos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const label = theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro';

  return (
    <Tooltip content={label} position="bottom">
      <button
        onClick={toggleTheme}
        type="button"
        className="h-8 w-8 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center cursor-pointer"
        aria-label={label}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
        ) : (
          <Moon className="w-4 h-4 text-slate-500" />
        )}
      </button>
    </Tooltip>
  );
};
