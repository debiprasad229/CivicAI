import React from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Users, 
  Building, 
  CheckSquare, 
  AlertCircle,
  Copy
} from 'lucide-react';
import { SeverityBadge, DuplicateBadge } from './Badge';

export default function AITriageCard({ aiAnalysis }) {
  if (!aiAnalysis) return null;

  const {
    urgencyScore = 50,
    severity = 'Medium',
    categoryDetected,
    subCategory,
    affectedGroups = [],
    safetyRiskAssessment,
    recommendedDepartment,
    actionableRecommendations = [],
    potentialDuplicateOf
  } = aiAnalysis;

  // Score meter color
  const scoreColor = urgencyScore >= 80 ? 'text-red-600 bg-red-50 border-red-200' :
                     urgencyScore >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                     'text-emerald-600 bg-emerald-50 border-emerald-200';

  const progressBg = urgencyScore >= 80 ? 'bg-red-500' :
                     urgencyScore >= 60 ? 'bg-amber-500' :
                     'bg-emerald-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Gemini AI Infrastructure Triage
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Automated
              </span>
            </h4>
            <p className="text-xs text-slate-500">Autonomous classification & hazard quantification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {potentialDuplicateOf && (
            <DuplicateBadge duplicateId={potentialDuplicateOf} />
          )}
          <SeverityBadge severity={severity} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Urgency Meter & Department */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-medium text-slate-500 block mb-1">Urgency Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">{urgencyScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressBg}`} 
                style={{ width: `${urgencyScore}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 md:col-span-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Recommended Municipal Department</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {recommendedDepartment || 'General Public Works Department'}
            </p>
            {subCategory && (
              <span className="inline-block text-xs text-slate-500 mt-1">
                Sub-classification: <strong className="text-slate-700">{subCategory}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        {safetyRiskAssessment && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Safety & Risk Assessment</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
              {safetyRiskAssessment}
            </p>
          </div>
        )}

        {/* Affected Demographics */}
        {affectedGroups && affectedGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Identified Affected Groups</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {affectedGroups.map((group, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        {actionableRecommendations && actionableRecommendations.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Actionable Resolution Protocol for Field Crew</span>
            </div>
            <ol className="space-y-2">
              {actionableRecommendations.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
