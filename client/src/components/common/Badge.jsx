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
  Copy,
  Construction,
  Lightbulb,
  Droplets,
  Waves,
  Trash2,
  Bus,
  Zap,
  HelpCircle,
  Globe
} from 'lucide-react';

export function StatusBadge({ status }) {
  const norm = (status || 'SUBMITTED').toUpperCase();

  const config = {
    'SUBMITTED': {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      label: 'Submitted'
    },
    'UNDER_REVIEW': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Info,
      label: 'Under Review'
    },
    'IN_REVIEW': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Info,
      label: 'Under Review'
    },
    'ASSIGNED': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: UserCheck,
      label: 'Assigned'
    },
    'IN_PROGRESS': {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Hammer,
      label: 'In Progress'
    },
    'RESOLVED': {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      label: 'Resolved'
    },
    'REJECTED': {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      label: 'Rejected'
    }
  };

  const current = config[norm] || config['SUBMITTED'];
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{current.label}</span>
    </span>
  );
}

export function SeverityBadge({ severity, score }) {
  const norm = (severity || 'MEDIUM').toUpperCase();

  const config = {
    'CRITICAL': {
      bg: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertCircle,
      dot: 'bg-red-500',
      label: 'Critical'
    },
    'HIGH': {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertTriangle,
      dot: 'bg-orange-500',
      label: 'High'
    },
    'MEDIUM': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      dot: 'bg-amber-500',
      label: 'Medium'
    },
    'LOW': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Info,
      dot: 'bg-emerald-500',
      label: 'Low'
    }
  };

  const current = config[norm] || config['MEDIUM'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-mono text-[10px] opacity-75 ml-0.5">({score})</span>
      )}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const norm = (category || 'OTHER').toUpperCase();

  const icons = {
    'ROAD': Construction,
    'STREET_LIGHT': Lightbulb,
    'WATER': Droplets,
    'DRAINAGE': Waves,
    'WASTE': Trash2,
    'PUBLIC_TRANSPORT': Bus,
    'ELECTRICITY': Zap,
    'OTHER': HelpCircle
  };

  const labels = {
    'ROAD': 'Roads & Footpaths',
    'STREET_LIGHT': 'Street Lighting',
    'WATER': 'Water Supply',
    'DRAINAGE': 'Drainage & Sewerage',
    'WASTE': 'Solid Waste',
    'PUBLIC_TRANSPORT': 'Transit',
    'ELECTRICITY': 'Electricity',
    'OTHER': 'Other'
  };

  const Icon = icons[norm] || HelpCircle;
  const label = labels[norm] || category;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
      <Icon className="w-3 h-3 text-slate-500" />
      <span>{label}</span>
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

export function LanguageBadge({ language }) {
  if (!language) return null;
  const norm = language.toLowerCase().trim();

  const configs = {
    hi: { label: 'Hindi (हिन्दी)', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    hindi: { label: 'Hindi (हिन्दी)', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    or: { label: 'Odia (ଓଡ଼ିଆ)', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    odia: { label: 'Odia (ଓଡ଼ିଆ)', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    oriya: { label: 'Odia (ଓଡ଼ିଆ)', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    en: { label: 'English', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    english: { label: 'English', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
  };

  const current = configs[norm] || {
    label: language.toUpperCase(),
    bg: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg}`}>
      <Globe className="w-3.5 h-3.5" />
      <span>{current.label}</span>
    </span>
  );
}
