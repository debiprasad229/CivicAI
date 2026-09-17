import React from 'react';
import { 
  Sparkles, 
  Users, 
  Building, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  FileText
} from 'lucide-react';
import { SeverityBadge, DuplicateBadge, CategoryBadge } from './Badge';

export default function AITriageCard({ aiAnalysis, complaint = null }) {
  if (!aiAnalysis && !complaint) return null;

  // Merge values from complaint and aiAnalysis
  const analysis = aiAnalysis || complaint?.aiAnalysis || {};
  const status = analysis.status || (complaint?.aiSummary ? 'COMPLETED' : 'PENDING');

  const severity = analysis.severity || complaint?.severity || 'MEDIUM';
  const category = analysis.category || complaint?.category || 'OTHER';
  const reasoning = analysis.reasoning || analysis.rawResponse?.reasoning || '';
  
  const summary = complaint?.aiSummary || analysis.summary || analysis.safetyRiskAssessment || analysis.rawResponse?.summary || '';
  
  const affectedGroups = (Array.isArray(complaint?.affectedGroup) && complaint.affectedGroup.length > 0)
    ? complaint.affectedGroup
    : (Array.isArray(analysis.affectedGroup) && analysis.affectedGroup.length > 0)
      ? analysis.affectedGroup
      : (Array.isArray(analysis.affectedGroups) && analysis.affectedGroups.length > 0)
        ? analysis.affectedGroups
        : [];

  const recommendations = (Array.isArray(complaint?.recommendedAction) && complaint.recommendedAction.length > 0)
    ? complaint.recommendedAction
    : (Array.isArray(analysis.recommendedAction) && analysis.recommendedAction.length > 0)
      ? analysis.recommendedAction
      : (Array.isArray(analysis.actionableRecommendations) && analysis.actionableRecommendations.length > 0)
        ? analysis.actionableRecommendations
        : [];

  const urgencyScore = analysis.urgencyScore || (
    severity === 'CRITICAL' ? 95 :
    severity === 'HIGH' ? 75 :
    severity === 'MEDIUM' ? 50 : 25
  );

  const progressBg = urgencyScore >= 80 ? 'bg-red-500' :
                     urgencyScore >= 60 ? 'bg-amber-500' :
                     'bg-emerald-500';

  const potentialDuplicateOf = analysis.potentialDuplicateOf || complaint?.aiAnalysis?.potentialDuplicateOf;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Gemini AI Triage Assessment</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                status === 'COMPLETED' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {status === 'COMPLETED' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>Pending Triage</span>
                  </>
                )}
              </span>
            </h4>
            <p className="text-xs text-slate-500">Autonomous classification, severity scoring & response plan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {potentialDuplicateOf && (
            <DuplicateBadge duplicateId={potentialDuplicateOf} />
          )}
          <SeverityBadge severity={severity} />
          <CategoryBadge category={category} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Urgency Meter & Department */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Severity / Urgency Metric</span>
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

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 md:col-span-2 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Assigned Municipal Division</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {analysis.recommendedDepartment || `${category.replace(/_/g, ' ')} Public Works Bureau`}
            </p>
            {reasoning && (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                <strong>AI Reasoning:</strong> {reasoning}
              </p>
            )}
          </div>
        </div>

        {/* AI Executive Summary */}
        {summary && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Dispatch Summary</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 bg-indigo-50/40 border border-indigo-100 rounded-lg p-3 leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        {/* Affected Demographics */}
        {affectedGroups && affectedGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Identified Affected Demographics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {affectedGroups.map((group, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Municipal Protocol */}
        {recommendations && recommendations.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Action Protocol for Municipal Crew</span>
            </div>
            <ol className="space-y-2">
              {recommendations.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
