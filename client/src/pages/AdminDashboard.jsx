import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Loader2
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import StatCard from '../components/common/StatCard';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../components/common/Badge';
import MapContainer from '../components/common/MapContainer';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await complaintService.getAdminComplaints({ limit: 100 });
      const data = res.data?.complaints || res.data || [];
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to fetch live municipal intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute live KPIs
  const total = complaints.length;
  const criticalUnresolved = complaints.filter(
    c => (c.severity === 'CRITICAL' || c.severity === 'HIGH') && c.status !== 'RESOLVED'
  ).length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const pendingTriage = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;

  const criticalIssues = complaints.filter(
    c => (c.severity === 'CRITICAL' || c.severity === 'HIGH') && c.status !== 'RESOLVED'
  ).slice(0, 5);

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
            Autonomous Gemini AI triage, spatial GIS heatmaps, and cross-departmental dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            title="Refresh Feed"
            className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/app/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Manage All Complaints</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={loading ? '...' : total}
          icon={Building2}
          change="Across all sectors"
          isPositive={true}
          badgeColor="blue"
        />
        <StatCard
          title="Critical Unresolved"
          value={loading ? '...' : criticalUnresolved}
          icon={ShieldAlert}
          change="High / Critical hazard"
          isPositive={criticalUnresolved === 0}
          badgeColor="rose"
        />
        <StatCard
          title="Pending Triage"
          value={loading ? '...' : pendingTriage}
          icon={Clock}
          change="Submitted & In-Review"
          isPositive={false}
          badgeColor="amber"
        />
        <StatCard
          title="Resolved Grievances"
          value={loading ? '...' : resolvedCount}
          icon={CheckCircle2}
          change={`${total > 0 ? Math.round((resolvedCount / total) * 100) : 0}% resolution rate`}
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
          {loading ? (
            <div className="h-[380px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading geospatial layers...</p>
            </div>
          ) : (
            <MapContainer
              complaints={complaints}
              selectedComplaint={selectedIncident}
              onSelectComplaint={setSelectedIncident}
              center={[28.6139, 77.2090]}
              zoom={13}
              height="380px"
            />
          )}
        </div>

        {selectedIncident && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Incident</span>
              <h4 className="text-xs font-bold text-slate-900 truncate">{selectedIncident.title}</h4>
              <p className="text-[11px] text-slate-500 truncate">{selectedIncident.address || selectedIncident.location?.address}</p>
            </div>
            <Link
              to={`/app/complaints/${selectedIncident._id || selectedIncident.id}`}
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
              High / Critical
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading queue...</div>
            ) : criticalIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No high-urgency or critical issues pending dispatch.
              </div>
            ) : (
              criticalIssues.map((issue) => {
                const compId = issue._id || issue.id;
                return (
                  <div key={compId} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={issue.severity} />
                        <StatusBadge status={issue.status} />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/app/complaints/${compId}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 block line-clamp-1"
                    >
                      {issue.title}
                    </Link>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {issue.address || issue.location?.address}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <CategoryBadge category={issue.category} />
                      <Link
                        to={`/app/complaints/${compId}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Dispatch Crew →
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
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
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading submissions...</div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No complaints recorded yet.</div>
            ) : (
              complaints.slice(0, 5).map((comp) => {
                const compId = comp._id || comp.id;
                const displayId = comp._id ? `#${comp._id.slice(-6).toUpperCase()}` : comp.id;

                return (
                  <div key={compId} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">{displayId}</span>
                        <StatusBadge status={comp.status} />
                      </div>
                      <Link
                        to={`/app/complaints/${compId}`}
                        className="text-xs font-semibold text-slate-900 hover:text-blue-600 block truncate"
                      >
                        {comp.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {comp.address || comp.location?.address}
                      </span>
                    </div>

                    <Link
                      to={`/app/complaints/${compId}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 shrink-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
