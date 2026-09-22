import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldAlert, 
  MapPin, 
  ChevronRight, 
  Search,
  RefreshCw,
  Loader2,
  BarChart3,
  Flame,
  Layers,
  Map as MapIcon,
  Eye,
  X,
  Sparkles,
  Lightbulb,
  ShieldCheck,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  Legend 
} from 'recharts';
import { complaintService, COMPLAINT_CATEGORIES } from '../services/complaintService';
import StatCard from '../components/common/StatCard';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../components/common/Badge';
import MapContainer from '../components/common/MapContainer';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981'
};

const CATEGORY_NAMES = {
  ROAD: 'Roads',
  STREET_LIGHT: 'Lighting',
  WATER: 'Water',
  DRAINAGE: 'Drainage',
  WASTE: 'Waste',
  PUBLIC_TRANSPORT: 'Transit',
  ELECTRICITY: 'Power',
  OTHER: 'Other'
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Analytics Endpoints Data
  const [overview, setOverview] = useState(null);
  const [categoriesData, setCategoriesData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [trendDays, setTrendDays] = useState(30);

  // Complaints Data for Map and Table
  const [complaints, setComplaints] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Geographic Hotspots Data
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [activeHotspotFilter, setActiveHotspotFilter] = useState(null);
  const [hotspotRecommendations, setHotspotRecommendations] = useState({});
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);

  // Fetch AI infrastructure recommendation for selected hotspot
  const fetchHotspotRecommendation = useCallback(async (hotspot, forceRefresh = false) => {
    if (!hotspot || !hotspot.id) return;
    if (!forceRefresh && hotspotRecommendations[hotspot.id]) return;

    setRecommendationLoading(true);
    setRecommendationError(null);
    try {
      const res = await complaintService.getHotspotRecommendation(hotspot.id, hotspot, forceRefresh);
      if (res?.data) {
        setHotspotRecommendations((prev) => ({
          ...prev,
          [hotspot.id]: res.data
        }));
      }
    } catch (err) {
      console.error('Failed to fetch hotspot recommendation:', err);
      setRecommendationError(err.response?.data?.message || err.message || 'Failed to fetch AI recommendation');
    } finally {
      setRecommendationLoading(false);
    }
  }, [hotspotRecommendations]);

  // Automatically trigger AI recommendation when a hotspot is selected
  useEffect(() => {
    if (selectedHotspot) {
      fetchHotspotRecommendation(selectedHotspot);
    }
  }, [selectedHotspot, fetchHotspotRecommendation]);

  // Map Filter States
  const [mapCategoryFilter, setMapCategoryFilter] = useState('ALL');
  const [mapSeverityFilter, setMapSeverityFilter] = useState('ALL');
  const [mapStatusFilter, setMapStatusFilter] = useState('ALL');

  // Table Filter and Sorting States
  const [tableSearch, setTableSearch] = useState('');
  const [tableCategoryFilter, setTableCategoryFilter] = useState('ALL');
  const [tableSeverityFilter, setTableSeverityFilter] = useState('ALL');
  const [tableStatusFilter, setTableStatusFilter] = useState('ALL');
  const [tableSortBy, setTableSortBy] = useState('newest'); // 'newest' | 'oldest' | 'severity-desc' | 'severity-asc' | 'status'
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 8;

  // Load all intelligence data
  const fetchAllDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [overviewRes, catRes, sevRes, trendsRes, complaintsRes, hotspotsRes] = await Promise.all([
        complaintService.getAdminAnalyticsOverview(),
        complaintService.getAdminAnalyticsCategories(),
        complaintService.getAdminAnalyticsSeverity(),
        complaintService.getAdminAnalyticsTrends(trendDays),
        complaintService.getAdminComplaints({ limit: 300 }),
        complaintService.getAdminHotspots()
      ]);

      if (overviewRes.data?.data) {
        setOverview(overviewRes.data.data);
      }
      if (catRes.data?.data?.categories) {
        setCategoriesData(catRes.data.data.categories);
      }
      if (sevRes.data?.data?.severities) {
        setSeverityData(sevRes.data.data.severities);
      }
      if (trendsRes.data?.data?.trends) {
        setTrendsData(trendsRes.data.data.trends);
      }
      const complaintList = complaintsRes.data?.complaints || complaintsRes.data || [];
      setComplaints(complaintList);

      if (hotspotsRes.data?.data?.hotspots) {
        setHotspots(hotspotsRes.data.data.hotspots);
      }

    } catch (err) {
      console.error('Failed to load admin intelligence data:', err);
      setError(err.response?.data?.message || 'Unable to fetch real-time municipal intelligence.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // Handle complaint click navigating to details
  const handleComplaintClick = (complaint) => {
    const id = complaint._id || complaint.id;
    if (id) {
      navigate(`/app/complaints/${id}`);
    }
  };

  // Map Filtered Complaints
  const filteredMapComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchCat = mapCategoryFilter === 'ALL' || c.category === mapCategoryFilter;
      const matchSev = mapSeverityFilter === 'ALL' || c.severity === mapSeverityFilter;
      const matchStat = mapStatusFilter === 'ALL' || c.status === mapStatusFilter;
      return matchCat && matchSev && matchStat;
    });
  }, [complaints, mapCategoryFilter, mapSeverityFilter, mapStatusFilter]);

  // Table Filtered and Sorted Complaints
  const filteredAndSortedTableComplaints = useMemo(() => {
    const query = tableSearch.toLowerCase().trim();

    let list = complaints.filter((c) => {
      // Search match
      const titleMatch = (c.title || '').toLowerCase().includes(query);
      const descMatch = (c.description || '').toLowerCase().includes(query);
      const addrMatch = (c.address || c.location?.address || '').toLowerCase().includes(query);
      const idMatch = (c._id || c.id || '').toLowerCase().includes(query);
      const matchesSearch = !query || titleMatch || descMatch || addrMatch || idMatch;

      // Dropdown filters
      const matchesCat = tableCategoryFilter === 'ALL' || c.category === tableCategoryFilter;
      const matchesSev = tableSeverityFilter === 'ALL' || c.severity === tableSeverityFilter;
      const matchesStat = tableStatusFilter === 'ALL' || c.status === tableStatusFilter;

      // Hotspot filter (if active)
      let matchesHotspot = true;
      if (activeHotspotFilter && Array.isArray(activeHotspotFilter.complaintIds)) {
        const idStr = String(c._id || c.id);
        matchesHotspot = activeHotspotFilter.complaintIds.some(cid => String(cid) === idStr);
      }

      return matchesSearch && matchesCat && matchesSev && matchesStat && matchesHotspot;
    });

    // Sorting
    const severityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    list.sort((a, b) => {
      if (tableSortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (tableSortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (tableSortBy === 'severity-desc') {
        return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      }
      if (tableSortBy === 'severity-asc') {
        return (severityWeight[a.severity] || 0) - (severityWeight[b.severity] || 0);
      }
      if (tableSortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      return 0;
    });

    return list;
  }, [complaints, tableSearch, tableCategoryFilter, tableSeverityFilter, tableStatusFilter, tableSortBy, activeHotspotFilter]);

  // Paginated table items
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTableComplaints.length / pageSize));
  const paginatedTableComplaints = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredAndSortedTableComplaints.slice(start, start + pageSize);
  }, [filteredAndSortedTableComplaints, tablePage]);

  // Reset page when filters change
  useEffect(() => {
    setTablePage(1);
  }, [tableSearch, tableCategoryFilter, tableSeverityFilter, tableStatusFilter, tableSortBy, activeHotspotFilter]);

  // Chart Formats
  const formattedCategoryChartData = useMemo(() => {
    return categoriesData.map(c => ({
      rawCategory: c.category,
      name: CATEGORY_NAMES[c.category] || c.category,
      count: c.count,
      resolved: c.resolved,
      critical: c.critical
    }));
  }, [categoriesData]);

  const formattedSeverityChartData = useMemo(() => {
    return severityData.map(s => ({
      name: s.severity,
      value: s.count,
      percentage: s.percentage,
      color: SEVERITY_COLORS[s.severity] || '#64748b'
    }));
  }, [severityData]);

  const totalReports = overview?.total ?? complaints.length;
  const pendingCount = overview?.pending ?? complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length;
  const highPriorityCount = overview?.highCritical ?? complaints.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL').length;
  const resolvedCount = overview?.resolved ?? complaints.filter(c => c.status === 'RESOLVED').length;
  const resolutionRate = overview?.resolutionRate ?? (totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="tracking-wide uppercase">Municipal Intelligence Command System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Admin Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live telemetry, geospatial GIS heatmaps, AI hazard triage, and municipal workflow dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAllDashboardData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>
          
          <Link
            to="/app/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Complaint Triage</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchAllDashboardData(true)} className="underline hover:text-red-950">Retry</button>
        </div>
      )}

      {/* 1. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={loading ? '...' : totalReports}
          icon={Building2}
          change="Citywide logged grievances"
          isPositive={true}
          badgeColor="blue"
        />
        <StatCard
          title="Pending"
          value={loading ? '...' : pendingCount}
          icon={Clock}
          change="Submitted & under review"
          isPositive={pendingCount === 0}
          badgeColor="amber"
        />
        <StatCard
          title="High Priority"
          value={loading ? '...' : highPriorityCount}
          icon={ShieldAlert}
          change="High & Critical hazards"
          isPositive={highPriorityCount === 0}
          badgeColor="rose"
        />
        <StatCard
          title="Resolved"
          value={loading ? '...' : resolvedCount}
          icon={CheckCircle2}
          change={`${resolutionRate}% overall resolution`}
          isPositive={true}
          badgeColor="emerald"
        />
      </div>

      {/* 2. CHARTS SECTION (Category, Severity, Time Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Time Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Incident Influx & Resolution Timeline</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily reports filed versus resolved municipal grievances
              </p>
            </div>

            {/* Days Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setTrendDays(days)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    trendDays === days 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                Loading trends...
              </div>
            ) : trendsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No trend data recorded for this duration.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendReportsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="trendResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="trendCriticalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    labelFormatter={(val) => `Date: ${val}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area type="monotone" dataKey="total" name="Total Reports" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#trendReportsGrad)" />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#trendResolvedGrad)" />
                  <Area type="monotone" dataKey="critical" name="High / Critical" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#trendCriticalGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Breakdown Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Severity Breakdown</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Risk hierarchy categorization
            </p>
          </div>

          <div className="h-52 w-full my-2">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                Loading severity tiers...
              </div>
            ) : formattedSeverityChartData.every(s => s.value === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No incidents reported.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedSeverityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {formattedSeverityChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, item) => [`${value} complaints (${item.payload.percentage}%)`, name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Severity Legend Badges */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            {formattedSeverityChartData.map((s) => (
              <div key={s.name} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                  <span className="text-slate-700 font-medium truncate">{s.name}</span>
                </div>
                <span className="font-bold text-slate-900 shrink-0 ml-1">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Bar Chart (Full Width) */}
        <div className="lg:col-span-12 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Complaints by Infrastructure Category</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Volume breakdown across roads, lighting, water, drainage, waste, and electrical networks
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                Loading categories...
              </div>
            ) : formattedCategoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No category data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedCategoryChartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#475569' }} 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="count" name="Total Filed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="critical" name="High / Critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 3. INTERACTIVE GIS MAP WITH FILTERS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Geospatial GIS Hotspot Map</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {filteredMapComplaints.length} markers shown
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter complaints geographically across category, severity, and workflow status
              </p>
            </div>

            {/* Map Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-slate-400 font-medium">Category:</span>
                <select
                  value={mapCategoryFilter}
                  onChange={(e) => setMapCategoryFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {COMPLAINT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-slate-400 font-medium">Severity:</span>
                <select
                  value={mapSeverityFilter}
                  onChange={(e) => setMapSeverityFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-slate-400 font-medium">Status:</span>
                <select
                  value={mapStatusFilter}
                  onChange={(e) => setMapStatusFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {(mapCategoryFilter !== 'ALL' || mapSeverityFilter !== 'ALL' || mapStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setMapCategoryFilter('ALL');
                    setMapSeverityFilter('ALL');
                    setMapStatusFilter('ALL');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="p-4">
          {loading ? (
            <div className="h-[420px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Initializing GIS Tile Layer...</p>
            </div>
          ) : (
            <MapContainer
              complaints={filteredMapComplaints}
              selectedComplaint={selectedIncident}
              onSelectComplaint={(c) => {
                setSelectedIncident(c);
                setSelectedHotspot(null);
              }}
              hotspots={hotspots}
              selectedHotspot={selectedHotspot}
              onSelectHotspot={(h) => {
                setSelectedHotspot(h);
                setSelectedIncident(null);
              }}
              center={[28.6139, 77.2090]}
              zoom={12}
              height="440px"
            />
          )}
        </div>

        {/* Selected Hotspot Statistics & AI Recommendation Inspector */}
        {selectedHotspot && (
          <div className="border-t border-orange-200 bg-orange-50/70">
            {/* Hotspot Statistics Bar */}
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-orange-200/60">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-950 bg-orange-200/90 px-2 py-0.5 rounded flex items-center gap-1">
                    <span>🔥</span>
                    <span>Geographic Hotspot #{selectedHotspot.id}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-100 text-red-800 border border-red-200">
                    Priority Score: {selectedHotspot.priorityScore}/100
                  </span>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedHotspot.complaintCount} Complaints
                  </span>
                  <span className="text-xs font-semibold text-red-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedHotspot.highPriorityCount} High/Critical
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Dominant Sector: </span>
                    <span className="font-bold text-slate-900">{selectedHotspot.dominantCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Cluster Radius: </span>
                    <span className="font-semibold text-slate-800">~{selectedHotspot.radiusMeters}m</span>
                  </div>
                  {selectedHotspot.addresses?.length > 0 && (
                    <div className="truncate max-w-md">
                      <span className="text-slate-400">Area: </span>
                      <span className="font-medium text-slate-800">{selectedHotspot.addresses[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (activeHotspotFilter?.id === selectedHotspot.id) {
                      setActiveHotspotFilter(null);
                    } else {
                      setActiveHotspotFilter(selectedHotspot);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeHotspotFilter?.id === selectedHotspot.id
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{activeHotspotFilter?.id === selectedHotspot.id ? '✓ Filtering Ledger' : 'Filter Ledger to Hotspot'}</span>
                </button>

                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="p-2 text-slate-500 hover:text-slate-700 text-xs rounded-lg border border-slate-200 bg-white cursor-pointer"
                  title="Deselect Hotspot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Recommendation Section */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-amber-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-lg shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      AI Recommendation
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Based on available CivicAI complaint data
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {hotspotRecommendations[selectedHotspot.id] && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${
                      hotspotRecommendations[selectedHotspot.id].urgency === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : hotspotRecommendations[selectedHotspot.id].urgency === 'HIGH'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : hotspotRecommendations[selectedHotspot.id].urgency === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {hotspotRecommendations[selectedHotspot.id].urgency} Urgency
                    </span>
                  )}

                  <button
                    onClick={() => fetchHotspotRecommendation(selectedHotspot, true)}
                    disabled={recommendationLoading}
                    className="p-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Regenerate AI Recommendation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${recommendationLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {recommendationLoading && !hotspotRecommendations[selectedHotspot.id] ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <p className="text-xs font-semibold text-slate-600">
                    Synthesizing civic patterns & municipal intervention options with Gemini...
                  </p>
                </div>
              ) : recommendationError && !hotspotRecommendations[selectedHotspot.id] ? (
                <div className="p-3 my-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
                  <span>{recommendationError}</span>
                  <button
                    onClick={() => fetchHotspotRecommendation(selectedHotspot, true)}
                    className="font-bold underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : hotspotRecommendations[selectedHotspot.id] ? (
                <div className="mt-3 space-y-3">
                  {/* Recommended Intervention */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Recommended Intervention
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      {hotspotRecommendations[selectedHotspot.id].recommendedIntervention}
                    </div>
                  </div>

                  {/* Reason and Expected Benefit Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Reasoning & Pattern
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {hotspotRecommendations[selectedHotspot.id].reason}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Expected Civic Benefit
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {hotspotRecommendations[selectedHotspot.id].expectedBenefit}
                      </p>
                    </div>
                  </div>

                  {/* Mandatory Authority Disclaimer */}
                  <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">Municipal Verification Notice: </span>
                      {hotspotRecommendations[selectedHotspot.id].disclaimer || 'Recommendations are decision-support suggestions based on available CivicAI complaint data and require municipal authority verification before implementation.'}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Selected Complaint Banner below Map */}
        {selectedIncident && !selectedHotspot && (
          <div className="p-4 bg-blue-50/70 border-t border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded">
                  Selected Map Incident
                </span>
                <SeverityBadge severity={selectedIncident.severity} />
                <StatusBadge status={selectedIncident.status} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {selectedIncident.title}
              </h4>
              <p className="text-xs text-slate-600 truncate flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedIncident.address || selectedIncident.location?.address}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-2 text-slate-500 hover:text-slate-700 text-xs rounded-lg border border-slate-200 bg-white"
                title="Deselect"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleComplaintClick(selectedIncident)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Incident Dossier</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPLAINTS TABLE (Search, Filters, Sorting, Row Click) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">Comprehensive Grievance Ledger</h3>
                <span className="text-xs text-slate-500 font-normal">
                  ({filteredAndSortedTableComplaints.length} matched)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Search, filter, and inspect municipal tickets. Click any row to view complete AI analysis & dispatch history.
              </p>
            </div>
          </div>

          {/* Active Hotspot Filter Notice */}
          {activeHotspotFilter && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in-50">
              <div className="flex items-center gap-2 text-orange-950">
                <span className="text-base">🔥</span>
                <span>
                  Filtering ledger to <strong>Hotspot #{activeHotspotFilter.id}</strong> ({activeHotspotFilter.complaintCount} grievances, Priority Score: <strong className="text-red-700">{activeHotspotFilter.priorityScore}/100</strong>, Domain: <strong>{activeHotspotFilter.dominantCategory}</strong>)
                </span>
              </div>
              <button
                onClick={() => setActiveHotspotFilter(null)}
                className="px-2.5 py-1 rounded-md bg-white border border-orange-200 text-orange-800 font-bold hover:bg-orange-100/70 transition-colors cursor-pointer text-xs shrink-0"
              >
                Clear Hotspot Filter
              </button>
            </div>
          )}

          {/* Search, Filter & Sort Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search by title, address, description, ID..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-all shadow-2xs"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={tableCategoryFilter}
                onChange={(e) => setTableCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {COMPLAINT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <select
                value={tableSeverityFilter}
                onChange={(e) => setTableSeverityFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={tableStatusFilter}
                onChange={(e) => setTableStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div>
              <select
                value={tableSortBy}
                onChange={(e) => setTableSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="severity-desc">Sort: Severity (High → Low)</option>
                <option value="severity-asc">Sort: Severity (Low → High)</option>
                <option value="status">Sort: Status (A → Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading municipal complaints...
                  </td>
                </tr>
              ) : paginatedTableComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No complaints match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTableComplaints.map((c) => {
                  const id = c._id || c.id;
                  const displayId = id ? `#${id.slice(-6).toUpperCase()}` : '#ID';
                  const dateStr = new Date(c.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={id}
                      onClick={() => handleComplaintClick(c)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Ticket / Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                            {displayId}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-xs sm:max-w-sm">
                          {c.title}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <CategoryBadge category={c.category} />
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SeverityBadge severity={c.severity} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.address || c.location?.address || 'Location provided'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                        {dateStr}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplaintClick(c);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-700 text-slate-600 text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">
              {filteredAndSortedTableComplaints.length === 0 ? 0 : (tablePage - 1) * pageSize + 1}
            </span> to <span className="font-bold text-slate-900">
              {Math.min(tablePage * pageSize, filteredAndSortedTableComplaints.length)}
            </span> of <span className="font-bold text-slate-900">
              {filteredAndSortedTableComplaints.length}
            </span> complaints
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTablePage(p => Math.max(1, p - 1))}
              disabled={tablePage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Previous
            </button>
            <span className="font-medium text-slate-500">
              Page {tablePage} of {totalPages}
            </span>
            <button
              onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
              disabled={tablePage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 5. GEOGRAPHIC HOTSPOTS DETECTED */}
      {hotspots.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900">Detected Geographic Hotspots</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  {hotspots.length} Clusters
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-incident civic clusters grouped by spatial proximity and scored with deterministic hazard priority (0–100)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {hotspots.map((hotspot) => {
              const isSelected = selectedHotspot?.id === hotspot.id;
              const isFiltered = activeHotspotFilter?.id === hotspot.id;
              const score = hotspot.priorityScore || 0;

              return (
                <div
                  key={hotspot.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200'
                      : 'border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-extrabold uppercase text-slate-400">
                        #{hotspot.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-50 text-red-700 border border-red-200">
                        Priority: {score}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CategoryBadge category={hotspot.dominantCategory} />
                      <span className="text-xs font-bold text-slate-800">
                        {hotspot.complaintCount} Reports
                      </span>
                      {hotspot.highPriorityCount > 0 && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {hotspot.highPriorityCount} High Hazard
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cluster Radius: ~{hotspot.radiusMeters}m</span>
                        <span>Spread: {hotspot.spreadMeters || 100}m</span>
                      </div>
                      {hotspot.addresses?.length > 0 && (
                        <div className="text-[11px] text-slate-600 line-clamp-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{hotspot.addresses[0]}</span>
                        </div>
                      )}
                      {hotspotRecommendations[hotspot.id] && (
                        <div className="mt-1.5 p-2 bg-amber-50/80 border border-amber-200/70 rounded-lg">
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-900">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>AI Recommendation</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium line-clamp-1 mt-0.5">
                            {hotspotRecommendations[hotspot.id].recommendedIntervention}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedHotspot(hotspot);
                        setSelectedIncident(null);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Focus Map
                    </button>

                    <button
                      onClick={() => {
                        if (isFiltered) {
                          setActiveHotspotFilter(null);
                        } else {
                          setActiveHotspotFilter(hotspot);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                        isFiltered
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isFiltered ? 'Filtering' : 'Filter Ledger'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TOP MUNICIPAL PROBLEM AREAS (from overview.topAreas) */}
      {overview?.topAreas && overview.topAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Top Incident Hotspots & Areas</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Localities and wards with the highest recorded complaint density
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overview.topAreas.slice(0, 6).map((area, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setTableSearch(area.area);
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-2xs"
                title="Click to filter table by this area"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                    <span>#{idx + 1}</span>
                    <span className="text-slate-600 font-semibold truncate">{area.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">{area.count} total</span>
                    {area.criticalCount > 0 && (
                      <span className="text-red-600 font-bold">
                        • {area.criticalCount} critical
                      </span>
                    )}
                    {area.resolvedCount > 0 && (
                      <span className="text-emerald-600 font-medium">
                        • {area.resolvedCount} resolved
                      </span>
                    )}
                  </div>
                </div>

                <span className="px-2 py-1 rounded-md bg-slate-100 font-bold text-slate-900 text-xs shrink-0">
                  {area.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
