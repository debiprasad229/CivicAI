import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Copy, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  Info
} from 'lucide-react';
import { SeverityBadge, StatusBadge } from '../common/Badge';

export default function SimilarComplaintsCard({ 
  similarData = null, 
  loading = false 
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-200 rounded" />
        </div>
        <div className="h-3 w-72 bg-slate-100 rounded" />
        <div className="h-20 bg-slate-50 rounded-lg border border-slate-200" />
      </div>
    );
  }

  if (!similarData) return null;

  const {
    hasCandidates = false,
    candidateCount = 0,
    searchRadiusMeters = 1000,
    similarComplaints = [],
    summaryExplanation = '',
    adminReviewRequired = true
  } = similarData;

  const likelyDuplicates = similarComplaints.filter(c => c.isLikelyDuplicate || (c.similarityConfidence && c.similarityConfidence >= 60));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Copy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Geospatial Duplicate & Similarity Detection</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {candidateCount} Nearby {candidateCount === 1 ? 'Candidate' : 'Candidates'}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              MongoDB 2dsphere proximity ({searchRadiusMeters}m radius) evaluated by Gemini AI
            </p>
          </div>
        </div>

        {/* Policy Notice */}
        {adminReviewRequired && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Admin Review Required (No Auto-Merge)</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* No candidate grievances found */}
        {!hasCandidates || similarComplaints.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold block text-sm mb-0.5">Distinct Civic Issue</span>
              <p className="leading-relaxed">
                {summaryExplanation || `No other registered complaints detected within a ${searchRadiusMeters}m radius in this infrastructure category. This report represents an isolated incident.`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Banner */}
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
              likelyDuplicates.length > 0 
                ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                : 'bg-blue-50/60 border-blue-200 text-blue-900'
            }`}>
              {likelyDuplicates.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold">
                  {likelyDuplicates.length > 0 
                    ? `Potential Duplicate Alert (${likelyDuplicates.length} highly similar ${likelyDuplicates.length === 1 ? 'report' : 'reports'})` 
                    : 'Nearby Infrastructure Activity Detected'}
                </span>
                <p className="text-xs leading-relaxed">{summaryExplanation}</p>
              </div>
            </div>

            {/* List of Similar / Duplicate Candidates */}
            <div className="space-y-3">
              {similarComplaints.map((item, idx) => {
                const conf = item.similarityConfidence ?? 50;
                const isHighMatch = item.isLikelyDuplicate || conf >= 75;
                const candidate = item.candidateDetails || {};
                const candidateId = item.complaintId || candidate._id;

                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isHighMatch 
                        ? 'border-amber-300 bg-amber-50/30' 
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Confidence Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          conf >= 75 ? 'bg-red-50 text-red-700 border-red-200' :
                          conf >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {conf}% Duplicate Match
                        </span>

                        {/* Distance Badge */}
                        {item.distanceMeters != null && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span>{item.distanceMeters < 1000 ? `${item.distanceMeters}m away` : `${(item.distanceMeters / 1000).toFixed(1)}km away`}</span>
                          </span>
                        )}

                        {candidate.severity && <SeverityBadge severity={candidate.severity} />}
                        {candidate.status && <StatusBadge status={candidate.status} />}
                      </div>

                      {candidateId && (
                        <Link
                          to={`/app/complaints/${candidateId}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <span>Inspect Report</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                      {candidate.title || `Candidate Complaint #${String(candidateId).slice(-6).toUpperCase()}`}
                    </h5>

                    {candidate.address && (
                      <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                        <span>📍</span>
                        <span>{candidate.address}</span>
                      </p>
                    )}

                    {/* AI Comparative Explanation */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900 block mb-0.5 text-[11px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>AI Comparative Assessment:</span>
                      </span>
                      {item.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
