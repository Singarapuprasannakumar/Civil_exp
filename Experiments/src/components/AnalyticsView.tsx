import React from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export const AnalyticsView: React.FC = () => {
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Completed Tests',
        data: [180, 210, 240, 220, 260, 290, 310],
        backgroundColor: '#2563EB',
        borderRadius: 8
      }
    ]
  };

  const doughnutData = {
    labels: ['Index Properties', 'Compaction', 'Shear Strength', 'Permeability', 'Field Tests'],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: ['#2563EB', '#14B8A6', '#7C3AED', '#F59E0B', '#10B981']
      }
    ]
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Laboratory Analytics & KPI Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Quantitative metrics on test volume, equipment productivity, and sample failure rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MONTHLY TEST VOLUME */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Monthly Laboratory Test Volume
          </h3>
          <div className="h-[240px]">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* TEST DISTRIBUTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Test Distribution by Category
          </h3>
          <div className="h-[240px] flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};
