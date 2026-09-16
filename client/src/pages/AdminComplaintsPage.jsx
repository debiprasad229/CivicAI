import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { complaintService, COMPLAINT_CATEGORIES } from '../services/complaintService';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../components/common/Badge';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await complaintService.getAdminComplaints({
        search: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        severity: severityFilter
      });
      setComplaints(res.data?.complaints || res.data || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError(err.response?.data?.message || 'Failed to load administrative complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [categoryFilter, statusFilter, severityFilter, searchQuery]);

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await complaintService.updateComplaintStatus(
        id, 
        newStatus, 
        `Status updated to ${newStatus} by municipal administrator.`
      );

      setComplaints(prev => prev.map(c => {
        if (c._id === id || c.id === id) {
          return {
            ...c,
            status: newStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));

      setSuccessMsg(`Complaint status successfully updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Failed to update complaint status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!complaints.length) {
      alert('No complaints to export.');
      return;
    }

    const headers = ['ID', 'Title', 'Category', 'Severity', 'Status', 'Address', 'Language', 'Created At'];
    const rows = complaints.map(c => [
      c._id || c.id,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.category,
      c.severity,
      c.status,
      `"${(c.address || c.location?.address || '').replace(/"/g, '""')}"`,
      c.language || 'en',
      new Date(c.createdAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `civic_ai_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            City Infrastructure Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete administrative catalog of citizen-reported infrastructure grievances and AI triage classifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            title="Refresh feed"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, ID, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Categories</option>
              {COMPLAINT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (Hazard)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <strong>{complaints.length}</strong> matching records</span>
          {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || severityFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-medium">Loading municipal complaints registry...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No complaints found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Issue Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">AI Urgency / Severity</th>
                  <th className="py-3.5 px-4">Status & Action</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => {
                  const compId = c._id || c.id;
                  const displayId = c._id ? `#${c._id.slice(-6).toUpperCase()}` : c.id;
                  const isUpdating = updatingId === compId;

                  return (
                    <tr key={compId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap align-top">
                        {displayId}
                      </td>
                      
                      <td className="py-3.5 px-4 max-w-sm align-top">
                        <Link
                          to={`/app/complaints/${compId}`}
                          className="font-bold text-slate-900 hover:text-blue-600 block line-clamp-1"
                        >
                          {c.title}
                        </Link>
                        <p className="text-slate-500 text-[11px] truncate mt-0.5">
                          {c.address || c.location?.address || 'Municipal Location'}
                        </p>
                        {c.affectedGroup && (
                          <span className="inline-block mt-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Target: {c.affectedGroup}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 align-top">
                        <CategoryBadge category={c.category} />
                        <span className="block text-[10px] text-slate-400 mt-1">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <SeverityBadge 
                          severity={c.severity} 
                          score={c.aiAnalysis?.urgencyScore} 
                        />
                        {c.recommendedAction && (
                          <span className="block text-[10px] text-slate-500 mt-1 truncate max-w-[160px]" title={c.recommendedAction}>
                            Rec: {c.recommendedAction}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-2">
                          <select
                            disabled={isUpdating}
                            value={c.status}
                            onChange={(e) => handleQuickStatusChange(compId, e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600 disabled:opacity-50"
                          >
                            <option value="SUBMITTED">Submitted</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                        <Link
                          to={`/app/complaints/${compId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
