import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Hammer, 
  XCircle,
  Copy
} from 'lucide-react';

export function StatusBadge({ status }) {
  const config = {
    'Submitted': {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      label: 'Submitted'
    },
    'In Review': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Info,
      label: 'In Review'
    },
    'Assigned': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: UserCheck,
      label: 'Assigned'
    },
    'In Progress': {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Hammer,
      label: 'In Progress'
    },
    'Resolved': {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      label: 'Resolved'
    },
    'Rejected': {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      label: 'Rejected'
    }
  };

  const current = config[status] || config['Submitted'];
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
    </span>
  );
}

export function SeverityBadge({ severity, score }) {
  const config = {
    'Critical': {
      bg: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertCircle,
      dot: 'bg-red-500'
    },
    'High': {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertTriangle,
      dot: 'bg-orange-500'
    },
    'Medium': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      dot: 'bg-amber-500'
    },
    'Low': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Info,
      dot: 'bg-emerald-500'
    }
  };

  const current = config[severity] || config['Medium'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{severity}</span>
      {score !== undefined && (
        <span className="font-mono text-[10px] opacity-75 ml-0.5">({score})</span>
      )}
    </span>
  );
}

export function DuplicateBadge({ duplicateId }) {
  if (!duplicateId) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
      <Copy className="w-3 h-3" />
      <span>Duplicate of #{duplicateId}</span>
    </span>
  );
}
