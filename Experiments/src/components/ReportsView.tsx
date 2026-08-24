import React from 'react';
import { FileText, Download, Eye, Share2, Search, Filter, Plus, CheckCircle2, Clock } from 'lucide-react';
import { mockReports } from '../data/mockData';

interface ReportsViewProps {
  onShowToast: (msg: string) => void;
  onOpenPdfPreview: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onShowToast, onOpenPdfPreview }) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Official Geotechnical Test Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Certified laboratory reports with digital QR verification & engineer sign-offs.
          </p>
        </div>

        <button 
          onClick={onOpenPdfPreview}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Generate New Report</span>
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-soft">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-72">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter reports by project or ID..." 
              className="bg-transparent text-xs outline-none text-slate-900 dark:text-white placeholder-slate-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Report ID & Title</th>
              <th className="p-4">Project</th>
              <th className="p-4">Sample ID</th>
              <th className="p-4">Engineer</th>
              <th className="p-4">Status</th>
              <th className="p-4">Generated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {mockReports.map((rep) => (
              <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{rep.title}</div>
                      <span className="text-[10px] text-slate-400 font-semibold">{rep.id} • {rep.fileSize}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{rep.projectName}</td>
                <td className="p-4 font-mono font-semibold text-blue-600">{rep.sampleId}</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">{rep.engineer}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rep.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  }`}>
                    {rep.status}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{rep.timestamp}</td>
                <td className="p-4 text-right space-x-1">
                  <button 
                    onClick={onOpenPdfPreview}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    title="Preview PDF"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onShowToast('Downloading Official Report PDF...')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
