import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { getComplaints } from '../utils/mockData';
import { StatusBadge, SeverityBadge, DuplicateBadge } from '../components/common/Badge';

export default function MyComplaintsPage() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const allComplaints = getComplaints();

  const filtered = allComplaints.filter(c => {
    const matchesStatus = filterStatus === 'All' 
      ? true 
      : filterStatus === 'Active' 
        ? c.status !== 'Resolved'
        : c.status === filterStatus;

    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Infrastructure Grievances</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor real-time progress, municipal department dispatches, and Gemini AI hazard assessments.
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Active', 'In Review', 'Assigned', 'In Progress', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by title, ID, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No grievances found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filter or search criteria.</p>
          </div>
        ) : (
          filtered.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {complaint.id}
                  </span>
                  <StatusBadge status={complaint.status} />
                  <SeverityBadge severity={complaint.aiAnalysis?.severity} score={complaint.aiAnalysis?.urgencyScore} />
                  <DuplicateBadge duplicateId={complaint.aiAnalysis?.potentialDuplicateOf} />
                  <span className="text-xs font-medium text-slate-400">• {complaint.category}</span>
                </div>

                <Link
                  to={`/app/complaints/${complaint.id}`}
                  className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                >
                  {complaint.title}
                </Link>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {complaint.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">{complaint.location.address}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reported: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                <Link
                  to={`/app/complaints/${complaint.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <span>Track Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
