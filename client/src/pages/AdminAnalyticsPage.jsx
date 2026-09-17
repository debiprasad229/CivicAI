import React, { useState, useEffect } from 'react';
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
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Download,
  Building,
  CheckCircle2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import StatCard from '../components/common/StatCard';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981'
};

const CATEGORY_LABELS = {
  ROAD: 'Roads & Footpaths',
  STREET_LIGHT: 'Street Lighting',
  WATER: 'Water Supply',
  DRAINAGE: 'Drainage & Sewer',
  WASTE: 'Waste & Sanitation',
  PUBLIC_TRANSPORT: 'Public Transit',
  ELECTRICITY: 'Power & Grid',
  OTHER: 'Other Amenity'
};

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [trends, setTrends] = useState([]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [ovRes, catRes, sevRes, trendRes] = await Promise.all([
        complaintService.getAdminAnalyticsOverview(),
        complaintService.getAdminAnalyticsCategories(),
        complaintService.getAdminAnalyticsSeverity(),
        complaintService.getAdminAnalyticsTrends(30)
      ]);

      if (ovRes.data?.data) setOverview(ovRes.data.data);
      if (catRes.data?.data?.categories) setCategories(catRes.data.data.categories);
      if (sevRes.data?.data?.severities) setSeverities(sevRes.data.data.severities);
      if (trendRes.data?.data?.trends) setTrends(trendRes.data.data.trends);
    } catch (err) {
      console.error('Failed to load live analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = overview?.total || 0;
  const resolutionRate = overview?.resolutionRate || 0;
  const highCritical = overview?.highCritical || 0;
  const pending = overview?.pending || 0;

  const categoryChartData = categories.map(c => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    count: c.count,
    resolved: c.resolved
  }));

  const severityChartData = severities.map(s => ({
    name: s.severity,
    value: s.count,
    percentage: s.percentage,
    color: SEVERITY_COLORS[s.severity] || '#94a3b8'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Executive Performance Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Citywide Grievance & Resolution Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live telemetry on complaint resolution rates, severity distributions, and municipal trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Resolution Rate"
          value={loading ? '...' : `${resolutionRate}%`}
          icon={CheckCircle2}
          change={`${overview?.resolved || 0} of ${total} resolved`}
          isPositive={true}
          badgeColor="emerald"
        />
        <StatCard
          title="Total Reports Logged"
          value={loading ? '...' : total}
          icon={Building}
          change="All civic departments"
          isPositive={true}
          badgeColor="blue"
        />
        <StatCard
          title="High/Critical Hazard Share"
          value={loading ? '...' : highCritical}
          icon={ShieldCheck}
          description="High Priority & Critical tickets"
          badgeColor="rose"
        />
        <StatCard
          title="Pending Grievances"
          value={loading ? '...' : pending}
          icon={Clock}
          description="Awaiting action"
          badgeColor="amber"
        />
      </div>

      {/* Chart Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Complaint vs Resolved Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Incident Influx vs. Resolution Trends</h3>
            <p className="text-xs text-slate-500">30-day timeline of citizen reports against completed repairs</p>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                Loading trends...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="total" name="Reports Filed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorComplaints)" />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Complaints Breakdown By Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Grievances by Infrastructure Domain</h3>
            <p className="text-xs text-slate-500">Distribution across roads, water, waste, lighting, transit & parks</p>
          </div>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                Loading categories...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Total Tickets" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Chart Grid: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Severity Distribution Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Severity Breakdown</h3>
            <p className="text-xs text-slate-500">Hazard tier distribution</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                Loading severity...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name, item) => [`${val} complaints (${item.payload.percentage}%)`, name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {severityChartData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 font-medium truncate">{s.name}:</span>
                <span className="font-bold text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Areas from Live Analytics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Top Problem Areas & Localities</h3>
              <p className="text-xs text-slate-500">Highest density of citizen grievances and critical hazards</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Area / Locality</th>
                    <th className="py-2.5 px-3 text-center">Total Grievances</th>
                    <th className="py-2.5 px-3 text-center">Critical Hazards</th>
                    <th className="py-2.5 px-3 text-right">Resolved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">Loading top areas...</td>
                    </tr>
                  ) : (!overview?.topAreas || overview.topAreas.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">No area data recorded yet.</td>
                    </tr>
                  ) : (
                    overview.topAreas.map((area, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-800">{area.area}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{area.count}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${area.criticalCount > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}`}>
                            {area.criticalCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-emerald-700">
                          {area.resolvedCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
