import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Check, 
  Printer, 
  Loader2, 
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Globe
} from 'lucide-react';
import complaintService from '../services/complaintService';
import { getComplaintById as getMockComplaintById } from '../utils/mockData';
import { StatusBadge, SeverityBadge, CategoryBadge, DuplicateBadge, LanguageBadge } from '../components/common/Badge';
import AITriageCard from '../components/common/AITriageCard';
import SimilarComplaintsCard from '../components/complaints/SimilarComplaintsCard';
import MapContainer from '../components/common/MapContainer';

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarData, setSimilarData] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    const loadComplaint = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await complaintService.getComplaintById(id);
        if (res && res.complaint) {
          setComplaint(res.complaint);
          setLoading(false);

          // Fetch similar complaints in background
          try {
            setSimilarLoading(true);
            const simRes = await complaintService.getSimilarComplaints(id);
            if (simRes && simRes.success) {
              setSimilarData(simRes);
            }
          } catch (simErr) {
            console.warn(`[ComplaintDetails] Similar complaints fetch: ${simErr.message}`);
          } finally {
            setSimilarLoading(false);
          }

          return;
        }
      } catch (err) {
        console.warn(`[ComplaintDetails] Backend fetch failed: ${err.message}. Checking mock store.`);
      }

      // Fallback to mock store for demo complaints if ID matches CIV-*
      const mock = getMockComplaintById(id);
      if (mock) {
        setComplaint(mock);
      } else {
        setError('Complaint not found or access denied.');
      }
      setLoading(false);
    };

    loadComplaint();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center max-w-lg mx-auto">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Retrieving Complaint Dossier</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to municipal records registry...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Incident Report Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {error || `The requested complaint ID #${id} does not exist or you lack permission to view it.`}
        </p>
        <Link
          to="/app/citizen/complaints"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Complaints</span>
        </Link>
      </div>
    );
  }

  const steps = [
    { label: 'Submitted', key: 'SUBMITTED' },
    { label: 'Under Review', key: 'UNDER_REVIEW' },
    { label: 'In Progress', key: 'IN_PROGRESS' },
    { label: 'Resolved', key: 'RESOLVED' }
  ];

  const statusNorm = (complaint.status || 'SUBMITTED').toUpperCase();
  const currentStepIdx = statusNorm === 'RESOLVED' ? 3 :
                         statusNorm === 'IN_PROGRESS' ? 2 :
                         ['UNDER_REVIEW', 'IN_REVIEW', 'ASSIGNED'].includes(statusNorm) ? 1 : 0;

  // Extract lat/lng safely from GeoJSON or object
  let lat = 28.6139;
  let lng = 77.2090;
  if (complaint.location?.coordinates && Array.isArray(complaint.location.coordinates)) {
    lng = complaint.location.coordinates[0];
    lat = complaint.location.coordinates[1];
  } else if (complaint.location?.coordinates?.lat) {
    lat = complaint.location.coordinates.lat;
    lng = complaint.location.coordinates.lng;
  }

  const ticketId = complaint._id ? `#${complaint._id.slice(-6).toUpperCase()}` : complaint.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/app/citizen/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Grievances</span>
        </Link>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {ticketId}
            </span>
            <StatusBadge status={complaint.status} />
            <SeverityBadge severity={complaint.severity} score={complaint.aiAnalysis?.urgencyScore} />
            <CategoryBadge category={complaint.category} />
            <LanguageBadge language={complaint.language} />
            <DuplicateBadge duplicateId={complaint.aiAnalysis?.potentialDuplicateOf} />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Lodged on {new Date(complaint.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {complaint.title}
            </h1>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Citizen's Original Grievance</span>
                <span className="text-[11px] font-normal text-slate-400">
                  Preserved verbatim (Language: {complaint.language?.toUpperCase() || 'EN'})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {complaint.originalDescription || complaint.description}
              </p>
            </div>
          </div>

          {/* AI Standardized English Summary */}
          {complaint.aiSummary && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Standardized English Summary</span>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                  Unified Municipal Dispatch
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {complaint.aiSummary}
              </p>
            </div>
          )}
        </div>

        {/* Progress Stepper */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Resolution Milestone Progress
          </div>
          <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1.5 ${
                    isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: AI Analysis Card & GIS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gemini AI Triage Card */}
        <AITriageCard 
          complaint={complaint} 
          aiAnalysis={complaint.aiAnalysis} 
        />

        {/* GIS Location & Geo-Coordinates */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Geographic Location</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <div className="text-xs text-slate-700">
              <span className="font-semibold block text-slate-900">{complaint.address}</span>
            </div>

            <MapContainer
              complaints={[{
                id: ticketId,
                title: complaint.title,
                category: complaint.category,
                location: { coordinates: { lat, lng }, address: complaint.address },
                aiAnalysis: { severity: complaint.severity }
              }]}
              selectedComplaint={{
                location: { coordinates: { lat, lng } }
              }}
              center={[lat, lng]}
              zoom={15}
              height="220px"
            />
          </div>
        </div>
      </div>

      {/* Geospatial Duplicate & Proximity Detection Card */}
      <SimilarComplaintsCard 
        similarData={similarData} 
        loading={similarLoading} 
      />

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Official Municipal Timeline & Audit Log</h3>
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {(complaint.timeline || []).map((entry, idx) => (
            <div key={idx} className="flex items-start gap-4 relative pl-8">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute left-2 top-1.5 ring-4 ring-white" />
              <div className="flex-1 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-900">{entry.step || entry.status}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{entry.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
