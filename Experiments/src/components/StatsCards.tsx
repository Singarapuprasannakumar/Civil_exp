import React from 'react';
import { FlaskConical, CheckSquare, Clock, FileCheck, TrendingUp, TrendingDown } from 'lucide-react';

export const StatsCards: React.FC = () => {
  const stats = [
    {
      title: 'Total Tests',
      value: '16',
      desc: 'Available Tests',
      trend: '+4%',
      trendUp: true,
      icon: FlaskConical,
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-100 dark:border-blue-900/40'
    },
    {
      title: 'Completed',
      value: '245',
      desc: 'This Month',
      trend: '+18%',
      trendUp: true,
      icon: CheckSquare,
      bgColor: 'bg-teal-50 dark:bg-teal-950/50',
      iconColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-100 dark:border-teal-900/40'
    },
    {
      title: 'Pending',
      value: '18',
      desc: 'In Progress',
      trend: '-2%',
      trendUp: false,
      icon: Clock,
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-100 dark:border-amber-900/40'
    },
    {
      title: 'Reports Generated',
      value: '624',
      desc: 'This Month',
      trend: '+12%',
      trendUp: true,
      icon: FileCheck,
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-100 dark:border-purple-900/40'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-slate-900 border ${stat.borderColor} rounded-xl p-5 shadow-soft hover:shadow-elevated transition-all duration-300 flex items-center gap-4 group hover:-translate-y-1`}
          >
            <div className={`w-13 h-13 rounded-full ${stat.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
              <Icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>

            <div className="flex flex-col flex-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.title}</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{stat.value}</h3>
                <span className={`text-[10px] font-semibold flex items-center ${
                  stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {stat.trendUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {stat.trend}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{stat.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
