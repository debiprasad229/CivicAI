import React from 'react';
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
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';
import { getComplaints } from '../utils/mockData';
import StatCard from '../components/common/StatCard';
import { StatusBadge, SeverityBadge } from '../components/common/Badge';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const allComplaints = getComplaints();
  
  // Filter for demo citizen
  const myComplaints = allComplaints.slice(0, 4);
  const activeCount = myComplaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = myComplaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Citizen Portal • {user.ward || 'Ward 14'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your infrastructure reports and view real-time municipal resolution status in your ward.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/app/citizen/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lodge New Grievance</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Reports"
          value={activeCount}
          icon={Clock}
          description="In review or undergoing repair"
          badgeColor="amber"
        />
        <StatCard
          title="Resolved By Municipality"
          value={resolvedCount}
          icon={CheckCircle2}
          description="Verified completed works"
          badgeColor="emerald"
        />
        <StatCard
          title="Ward 14 Open Incidents"
          value="18"
          icon={MapPin}
          description="Across roads, water & lighting"
          badgeColor="blue"
        />
      </div>

      {/* Ward Advisory Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
        <Megaphone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold">Scheduled Water Pipeline Maintenance:</span> Ward 14 Northern sector will experience low pressure on Thursday between 01:00 PM and 05:00 PM due to feeder line reinforcement.
        </div>
      </div>

      {/* Recent Submissions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Infrastructure Grievances</h3>
            <p className="text-xs text-slate-500">Live timeline and AI triage status for your submitted issues</p>
          </div>
          <Link 
            to="/app/citizen/complaints"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {myComplaints.map((complaint) => (
            <div 
              key={complaint.id}
              className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">{complaint.id}</span>
                  <StatusBadge status={complaint.status} />
                  <SeverityBadge severity={complaint.aiAnalysis?.severity} score={complaint.aiAnalysis?.urgencyScore} />
                  <span className="text-xs text-slate-400">• {complaint.category}</span>
                </div>

                <Link 
                  to={`/app/complaints/${complaint.id}`}
                  className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                >
                  {complaint.title}
                </Link>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{complaint.location.address}</span>
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
                  to={`/app/complaints/${complaint.id}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                >
                  <span>Track Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
