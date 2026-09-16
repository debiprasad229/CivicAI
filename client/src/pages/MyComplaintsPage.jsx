import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Layers, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import complaintService from '../services/complaintService';
import { StatusBadge, SeverityBadge, CategoryBadge, DuplicateBadge } from '../components/common/Badge';

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await complaintService.getMyComplaints();
        if (res && res.complaints) {
          setComplaints(res.complaints);
        }
      } catch (err) {
        console.error('Failed to fetch complaints:', err.message);
        setError('Unable to load complaints from municipal server. Showing cached view.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filtered = complaints.filter(c => {
    const statusNorm = (c.status || '').toUpperCase();
    const matchesStatus = filterStatus === 'ALL'
      ? true
      : filterStatus === 'ACTIVE'
        ? !['RESOLVED', 'REJECTED'].includes(statusNorm)
        : statusNorm === filterStatus;

    const query = searchQuery.toLowerCase();
    const matchesSearch = (c.title || '').toLowerCase().includes(query) ||
                          (c._id || '').toLowerCase().includes(query) ||
                          (c.address || '').toLowerCase().includes(query) ||
                          (c.category || '').toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Infrastructure Grievances</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time track record of complaints lodged by your verified account.
          </p>
        </div>
        <Link
          to="/app/citizen/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Grievance</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by title, ID, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Loading your complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No grievances found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {complaints.length === 0 ? 'You have not submitted any infrastructure grievances yet.' : 'No grievances match the selected filter.'}
          </p>
          {complaints.length === 0 && (
            <Link
              to="/app/citizen/submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit First Complaint</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const ticketId = c._id ? `#${c._id.slice(-6).toUpperCase()}` : c.id;
            return (
              <div
                key={c._id || c.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {ticketId}
                    </span>
                    <StatusBadge status={c.status} />
                    <SeverityBadge severity={c.severity} score={c.aiAnalysis?.urgencyScore} />
                    <CategoryBadge category={c.category} />
                    <DuplicateBadge duplicateId={c.aiAnalysis?.potentialDuplicateOf} />
                  </div>

                  <Link
                    to={`/app/complaints/${c._id || c.id}`}
                    className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                  >
                    {c.title}
                  </Link>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">{c.address}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-end md:self-center">
                  <Link
                    to={`/app/complaints/${c._id || c.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    <span>Track Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
