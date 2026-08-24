import React from 'react';
import { Upload, FilePlus, Sparkles, FileDown, Zap } from 'lucide-react';

interface QuickActionsProps {
  onShowToast: (msg: string) => void;
  openAI: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onShowToast, openAI }) => {
  return (
    <div className="fixed bottom-12 right-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl z-30 select-none">
      <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span>Quick Actions:</span>
      </div>

      <button
        onClick={() => onShowToast('Opening Lab Data Import Wizard...')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Import Data</span>
      </button>

      <button
        onClick={() => onShowToast('Generating Master Geotechnical Summary Report...')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
      >
        <FilePlus className="w-3.5 h-3.5" />
        <span>Generate Report</span>
      </button>

      <button
        onClick={openAI}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white border border-purple-200 dark:border-purple-800 text-xs font-semibold transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>AI Analysis</span>
      </button>

      <button
        onClick={() => onShowToast('Exporting All Completed Tests to PDF...')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-200 hover:text-blue-600 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
      >
        <FileDown className="w-3.5 h-3.5 text-red-500" />
        <span>Export PDF</span>
      </button>
    </div>
  );
};
