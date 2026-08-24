import React, { useState } from 'react';
import { Search, FlaskRound, FileText, ArrowRight, X } from 'lucide-react';
import { SoilTest } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: SoilTest[];
  onOpenTest: (test: SoilTest) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  tests,
  onOpenTest
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const filtered = tests.filter(
    t => t.title.toLowerCase().includes(query.toLowerCase()) || 
         t.num.includes(query) ||
         t.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* INPUT */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search tests, reports, samples..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400"
          />
          <kbd className="text-[10px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* RESULTS */}
        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching tests or commands found.
            </div>
          ) : (
            filtered.map((test) => (
              <div
                key={test.id}
                onClick={() => {
                  onClose();
                  onOpenTest(test);
                }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {test.num}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                      {test.title}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-sm">
                      {test.desc}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
