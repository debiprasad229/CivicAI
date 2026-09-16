import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  MapPin, 
  ChevronRight, 
  Sparkles, 
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { getComplaints, MOCK_ADMIN_METRICS } from '../utils/mockData';
import StatCard from '../components/common/StatCard';
import { StatusBadge, SeverityBadge, DuplicateBadge } from '../components/common/Badge';
import MapContainer from '../components/common/MapContainer';

export default function AdminDashboard() {
  const allComplaints = getComplaints();
  const [selectedIncident, setSelectedIncident] = useState(null);

  const criticalIssues = allComplaints.filter(c => c.aiAnalysis?.urgencyScore >= 80);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Municipal Control Center • Live Triage Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            City Infrastructure Command Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Autonomous Gemini AI triage, spatial duplicate prevention, and cross-departmental dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Manage All Complaints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={MOCK_ADMIN_METRICS.totalComplaints}
          icon={Building2}
          change="+12% this week"
          isPositive={true}
          badgeColor="blue"
        />
        <StatCard
          title="Critical Unresolved"
          value={MOCK_ADMIN_METRICS.criticalUnresolved}
          icon={ShieldAlert}
          change="Urgent Dispatch SLA"
          isPositive={false}
          badgeColor="rose"
        />
        <StatCard
          title="Avg Resolution"
          value={`${MOCK_ADMIN_METRICS.avgResolutionHours} hrs`}
          icon={Clock}
          change="-4.2 hrs vs last mo"
          isPositive={true}
          badgeColor="amber"
        />
        <StatCard
          title="Duplicate Reduction"
          value={`${MOCK_ADMIN_METRICS.duplicateReductionPercent}%`}
          icon={Layers}
          change="AI Spatial Matching"
          isPositive={true}
          badgeColor="emerald"
        />
      </div>

      {/* Interactive GIS City Map Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-900" />
            <h3 className="text-sm font-bold text-slate-900">Interactive GIS Hotspot Map</h3>
            <span className="text-[11px] text-slate-500 font-normal">
              Showing active infrastructure complaints across all municipal wards
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>Click any marker to inspect triage details</span>
          </div>
        </div>

        <div className="p-4">
          <MapContainer
            complaints={allComplaints}
            selectedComplaint={selectedIncident}
            onSelectComplaint={setSelectedIncident}
            center={[28.6139, 77.2090]}
            zoom={13}
            height="380px"
          />
        </div>

        {selectedIncident && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Incident</span>
              <h4 className="text-xs font-bold text-slate-900 truncate">{selectedIncident.title}</h4>
              <p className="text-[11px] text-slate-500 truncate">{selectedIncident.location.address}</p>
            </div>
            <Link
              to={`/app/complaints/${selectedIncident.id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shrink-0"
            >
              Open Full Dossier
            </Link>
          </div>
        )}
      </div>

      {/* Two Column Grid: Critical Dispatch Queue & Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Critical Hazard Dispatch Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-red-50/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">High-Urgency Dispatch Queue</h3>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
              Score ≥ 80
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {criticalIssues.map((issue) => (
              <div key={issue.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Score: {issue.aiAnalysis?.urgencyScore}
                    </span>
                    <SeverityBadge severity={issue.aiAnalysis?.severity} />
                  </div>
                  <span className="text-[11px] text-slate-400">{issue.location.ward}</span>
                </div>

                <Link
                  to={`/app/complaints/${issue.id}`}
                  className="text-xs font-bold text-slate-900 hover:text-blue-600 block line-clamp-1"
                >
                  {issue.title}
                </Link>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  Dept: <strong className="text-slate-700">{issue.aiAnalysis?.recommendedDepartment}</strong>
                </p>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{issue.category}</span>
                  <Link
                    to={`/app/complaints/${issue.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Dispatch Crew →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Grievance Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Grievance Submissions</h3>
            <Link to="/app/admin/complaints" className="text-xs font-semibold text-blue-600 hover:underline">
              View All Table
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {allComplaints.slice(0, 5).map((comp) => (
              <div key={comp.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{comp.id}</span>
                    <StatusBadge status={comp.status} />
                  </div>
                  <Link
                    to={`/app/complaints/${comp.id}`}
                    className="text-xs font-semibold text-slate-900 hover:text-blue-600 block truncate"
                  >
                    {comp.title}
                  </Link>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {comp.location.address}
                  </span>
                </div>

                <Link
                  to={`/app/complaints/${comp.id}`}
                  className="p-1.5 text-slate-400 hover:text-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
