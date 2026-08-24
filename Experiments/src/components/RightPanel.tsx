import React from 'react';
import { FileText, Download } from 'lucide-react';
import { mockReports, mockActivity } from '../data/mockData';

export const RightPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 w-full lg:w-[340px] shrink-0">
      {/* CARD 1: RECENT REPORTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Recent Reports</h3>
          <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">View All</a>
        </div>

        <div className="flex flex-col gap-3">
          {mockReports.map((report) => (
            <div 
              key={report.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h4>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {report.sampleId} • {report.timestamp}
                </span>
              </div>

              <button 
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 flex items-center justify-center transition-colors"
                title="Download Report PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 2: RECENT ACTIVITY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
          <a href="#" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">View All</a>
        </div>

        <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {mockActivity.map((act) => {
            let dotColor = 'bg-teal-500 ring-teal-100 dark:ring-teal-950';
            if (act.type === 'running') dotColor = 'bg-amber-500 ring-amber-100 dark:ring-amber-950';
            if (act.type === 'generated') dotColor = 'bg-blue-500 ring-blue-100 dark:ring-blue-950';
            if (act.type === 'pending') dotColor = 'bg-purple-500 ring-purple-100 dark:ring-purple-950';

            return (
              <div key={act.id} className="relative flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 shrink-0 mt-1`} />
                
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-200 leading-snug">
                    {act.title}
                  </p>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {act.sampleId} • {act.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
