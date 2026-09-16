import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { 
  MOCK_CATEGORY_DISTRIBUTION, 
  MOCK_MONTHLY_TRENDS, 
  MOCK_DEPARTMENT_PERFORMANCE, 
  MOCK_SEVERITY_BREAKDOWN,
  MOCK_ADMIN_METRICS 
} from '../utils/mockData';
import StatCard from '../components/common/StatCard';

export default function AdminAnalyticsPage() {
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981'];

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
            Quantitative metrics on complaint resolution times, ward incident density, and department SLAs.
          </p>
        </div>

        <button 
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Resolution Rate"
          value="88.6%"
          icon={CheckCircle2}
          change="+3.4% YoY"
          isPositive={true}
          badgeColor="emerald"
        />
        <StatCard
          title="Avg Municipal SLA"
          value="26.4 hrs"
          icon={Clock}
          change="-14% vs Target"
          isPositive={true}
          badgeColor="blue"
        />
        <StatCard
          title="High/Critical Hazard Share"
          value="24.8%"
          icon={ShieldCheck}
          description="Priority 1 & 2 tickets"
          badgeColor="rose"
        />
        <StatCard
          title="Citizen Satisfaction"
          value="4.6 / 5.0"
          icon={TrendingUp}
          description="Verified post-fix feedback"
          badgeColor="amber"
        />
      </div>

      {/* Chart Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Complaint vs Resolved Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Incident Influx vs. Resolution Trends</h3>
            <p className="text-xs text-slate-500">Six-month comparison of citizen reports against completed repairs</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_MONTHLY_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="complaints" name="Reports Filed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorComplaints)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints Breakdown By Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Grievances by Infrastructure Domain</h3>
            <p className="text-xs text-slate-500">Distribution across roads, water, waste, lighting, transit & parks</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CATEGORY_DISTRIBUTION} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Total Tickets" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_SEVERITY_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {MOCK_SEVERITY_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {MOCK_SEVERITY_BREAKDOWN.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 font-medium">{s.name}:</span>
                <span className="font-bold text-slate-900">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department SLA & Resolution Speed Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Departmental Resolution Performance</h3>
              <p className="text-xs text-slate-500">Average repair turnaround and SLA compliance percentage</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Avg Resolution</th>
                    <th className="py-2.5 px-3">SLA Compliance</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_DEPARTMENT_PERFORMANCE.map(dept => (
                    <tr key={dept.department}>
                      <td className="py-3 px-3 font-semibold text-slate-800">{dept.department}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{dept.avgHours} hours</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${dept.compliance >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${dept.compliance}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700">{dept.compliance}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          dept.compliance >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {dept.compliance >= 90 ? 'High' : 'Under Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
