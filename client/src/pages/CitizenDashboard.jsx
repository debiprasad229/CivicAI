import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  MapPin, 
  Sparkles, 
  ShieldAlert, 
  Megaphone, 
  ArrowRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import StatCard from '../components/common/StatCard';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../components/common/Badge';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCitizenData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await complaintService.getMyComplaints();
      const data = res.data?.complaints || res.data || [];
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load citizen complaints:', err);
      setError('Unable to fetch your complaint history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizenData();
  }, []);

  const activeCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Citizen Portal • Public Grievance Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Citizen'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your infrastructure reports and view real-time municipal resolution status.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchCitizenData}
            title="Refresh"
            className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/app/citizen/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lodge New Grievance</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Reports"
          value={loading ? '...' : activeCount}
          icon={Clock}
          description="In review or undergoing municipal action"
          badgeColor="amber"
        />
        <StatCard
          title="Resolved Grievances"
          value={loading ? '...' : resolvedCount}
          icon={CheckCircle2}
          description="Verified completed municipal works"
          badgeColor="emerald"
        />
        <StatCard
          title="Total Submitted"
          value={loading ? '...' : complaints.length}
          icon={FileText}
          description="Lifetime infrastructure filings"
          badgeColor="blue"
        />
      </div>

      {/* Ward Advisory Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
        <Megaphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Automated AI Triage Active:</span> Complaints submitted with clear street addresses and photos receive rapid priority routing to appropriate municipal engineer teams.
        </div>
      </div>

      {/* Recent Submissions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Infrastructure Grievances</h3>
            <p className="text-xs text-slate-500">Live timeline and triage status for your submitted issues</p>
          </div>
          <Link 
            to="/app/citizen/complaints"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading grievance history...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <p>You have not submitted any complaints yet.</p>
            <Link
              to="/app/citizen/submit"
              className="inline-block mt-3 text-xs font-semibold text-blue-600 hover:underline"
            >
              Report your first civic issue →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.slice(0, 5).map((complaint) => {
              const compId = complaint._id || complaint.id;
              const displayId = complaint._id ? `#${complaint._id.slice(-6).toUpperCase()}` : complaint.id;

              return (
                <div 
                  key={compId}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{displayId}</span>
                      <StatusBadge status={complaint.status} />
                      <SeverityBadge severity={complaint.severity} />
                      <CategoryBadge category={complaint.category} />
                    </div>

                    <Link 
                      to={`/app/complaints/${compId}`}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                    >
                      {complaint.title}
                    </Link>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{complaint.address || complaint.location?.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right hidden md:block">
                      <span className="text-[11px] text-slate-400 block">Reported On</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link
                      to={`/app/complaints/${compId}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Track Status</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
