import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  isPositive, 
  description, 
  badgeColor = 'blue' 
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorMap[badgeColor] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(change || description) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <span className={`inline-flex items-center font-medium ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {change}
            </span>
          )}
          {description && (
            <span className="text-slate-500 truncate">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
