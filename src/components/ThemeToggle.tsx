import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

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

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center cursor-pointer"
      title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
      ) : (
        <Moon className="w-4 h-4 text-slate-500" />
      )}
    </button>
  );
};
