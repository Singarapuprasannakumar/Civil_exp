import React from 'react';
import { Activity, Clock } from 'lucide-react';

export const WelcomeSection: React.FC = () => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Welcome back, Lab Engineer <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor laboratory testing, reports, equipment, and ongoing sample analysis.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Live Monitoring</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Today's Progress: 88%</span>
        </div>
      </div>
    </div>
  );
};
