import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ArrowUpDown,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { getComplaints, saveComplaints } from '../utils/mockData';
import { StatusBadge, SeverityBadge, DuplicateBadge } from '../components/common/Badge';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState(getComplaints());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  const filtered = complaints.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesStat = statusFilter === 'All' || c.status === statusFilter;
    const matchesSev = severityFilter === 'All' || c.aiAnalysis?.severity === severityFilter;

    return matchesSearch && matchesCat && matchesStat && matchesSev;
  });

  const handleQuickStatusChange = (id, newStatus) => {
    const updated = complaints.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...c.timeline,
            {
              step: `Status Updated to ${newStatus}`,
              timestamp: new Date().toLocaleString(),
              note: `Updated by municipal administrator.`
            }
          ]
        };
      }
      return c;
    });
    setComplaints(updated);
    saveComplaints(updated);
  };

  const handleExportCSV = () => {
    alert('Exporting verified municipal grievance register (CSV)...');
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
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

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
              <option value="All">All Categories</option>
              <option value="Roads & Footpaths">Roads & Footpaths</option>
              <option value="Water Supply & Drainage">Water Supply & Drainage</option>
              <option value="Solid Waste & Sanitation">Solid Waste & Sanitation</option>
              <option value="Street Lighting & Electrical">Street Lighting</option>
              <option value="Public Transit & Traffic">Public Transit</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-600 focus:bg-white"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical (Hazard)</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <strong>{filtered.length}</strong> matching records</span>
          {(categoryFilter !== 'All' || statusFilter !== 'All' || severityFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('All');
                setStatusFilter('All');
                setSeverityFilter('All');
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
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap align-top">
                    {c.id}
                  </td>
                  
                  <td className="py-3.5 px-4 max-w-sm align-top">
                    <Link
                      to={`/app/complaints/${c.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 block line-clamp-1"
                    >
                      {c.title}
                    </Link>
                    <p className="text-slate-500 text-[11px] truncate mt-0.5">
                      {c.location.address}
                    </p>
                    {c.aiAnalysis?.potentialDuplicateOf && (
                      <div className="mt-1">
                        <DuplicateBadge duplicateId={c.aiAnalysis.potentialDuplicateOf} />
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 align-top">
                    <span className="font-medium">{c.category}</span>
                    <span className="block text-[10px] text-slate-400">{c.location.ward}</span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap align-top">
                    <SeverityBadge 
                      severity={c.aiAnalysis?.severity} 
                      score={c.aiAnalysis?.urgencyScore} 
                    />
                    <span className="block text-[10px] text-slate-400 mt-1">
                      Target Dept: {c.aiAnalysis?.recommendedDepartment ? c.aiAnalysis.recommendedDepartment.split(' ')[0] : 'PWD'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap align-top">
                    <div className="flex items-center gap-2">
                      <select
                        value={c.status}
                        onChange={(e) => handleQuickStatusChange(c.id, e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="In Review">In Review</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                    <Link
                      to={`/app/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
