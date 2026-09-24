import React from 'react';
import { Search, Sun, Moon, Menu } from 'lucide-react';
import { useAntigravity } from './AntigravityProvider';

interface TopHeaderProps {
  searchVal: string;
  setSearchVal: (v: string) => void;
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ searchVal, setSearchVal, onToggleSidebar }) => {
  const { theme, setTheme } = useAntigravity();

  return (
    <header className="h-[72px] min-h-[72px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* LEFT SIDEBAR TOGGLE */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* CENTER SEARCH BAR (APPROX 560PX WIDE, CENTERED) */}
      <div className="flex-1 flex justify-center max-w-[560px] mx-auto">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 w-full shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search experiments..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400 w-full font-medium"
          />
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />
        </button>

        {/* PERSONAL BRANDING BLOCK */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block leading-tight">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Created & Developed by</span>
            <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400">Singarapu Prasanna Kumar</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-800 shrink-0">
            SP
          </div>
        </div>
      </div>
    </header>
  );
};
