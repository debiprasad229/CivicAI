import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Layers,
  Check,
  Share2,
  Printer
} from 'lucide-react';
import { getComplaintById } from '../utils/mockData';
import { StatusBadge, SeverityBadge, DuplicateBadge } from '../components/common/Badge';
import AITriageCard from '../components/common/AITriageCard';
import MapContainer from '../components/common/MapContainer';

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const complaint = getComplaintById(id);

  if (!complaint) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Incident Report Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested complaint ID #{id} does not exist in the municipal registry.
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
    { label: 'Submitted', key: 'Submitted' },
    { label: 'AI Triage', key: 'In Review' },
    { label: 'Assigned', key: 'Assigned' },
    { label: 'Work In Progress', key: 'In Progress' },
    { label: 'Resolved', key: 'Resolved' }
  ];

  const currentStepIdx = complaint.status === 'Resolved' ? 4 :
                         complaint.status === 'In Progress' ? 3 :
                         complaint.status === 'Assigned' ? 2 :
                         complaint.status === 'In Review' ? 1 : 0;

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
              {complaint.id}
            </span>
            <StatusBadge status={complaint.status} />
            <SeverityBadge severity={complaint.aiAnalysis?.severity} score={complaint.aiAnalysis?.urgencyScore} />
            <DuplicateBadge duplicateId={complaint.aiAnalysis?.potentialDuplicateOf} />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Lodged on {new Date(complaint.createdAt).toLocaleString()}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {complaint.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Resolution Milestone Progress
          </div>
          <div className="grid grid-cols-5 gap-2 relative">
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
        <AITriageCard aiAnalysis={complaint.aiAnalysis} />

        {/* GIS Location & Geo-Coordinates */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Geographic Location</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {complaint.location?.coordinates?.lat.toFixed(4)}, {complaint.location?.coordinates?.lng.toFixed(4)}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <div className="text-xs text-slate-700">
              <span className="font-semibold block text-slate-900">{complaint.location.address}</span>
              <span className="text-slate-500">{complaint.location.ward}, {complaint.location.city}</span>
            </div>

            {complaint.location?.coordinates && (
              <MapContainer
                complaints={[complaint]}
                selectedComplaint={complaint}
                center={[complaint.location.coordinates.lat, complaint.location.coordinates.lng]}
                zoom={15}
                height="220px"
              />
            )}
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Official Municipal Timeline & Audit Log</h3>
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {complaint.timeline.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-4 relative pl-8">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 absolute left-2 top-1.5 ring-4 ring-white" />
              <div className="flex-1 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-900">{entry.step}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{entry.timestamp}</span>
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
