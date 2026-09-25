import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Layers, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Construction, 
  Droplets, 
  Trash2, 
  Lightbulb, 
  Bus, 
  Trees,
  Clock,
  TrendingUp,
  FileSearch,
  Users,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  X
} from 'lucide-react';
import { INFRASTRUCTURE_CATEGORIES } from '../utils/mockData';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [showOfficerBlocker, setShowOfficerBlocker] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isOfficer = isAuthenticated && role === 'admin';
  const dashboardPath = role === 'admin' ? '/app/admin' : '/app/citizen';
  const displayName = user?.name || (role === 'admin' ? 'Municipal Officer' : 'Resident Citizen');
  const avatarInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleReportClick = (e) => {
    if (e) e.preventDefault();
    if (isOfficer) {
      setShowOfficerBlocker(true);
      return;
    }
    navigate('/app/citizen/submit');
  };

  const handleSwitchToCitizenLogin = () => {
    setShowOfficerBlocker(false);
    logout();
    navigate('/login');
  };

  const categoryIcons = {
    roads: Construction,
    water: Droplets,
    sanitation: Trash2,
    lighting: Lightbulb,
    transit: Bus,
    parks: Trees
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Public Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">CivicAI</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Digital Public Infrastructure
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-slate-900 transition-colors">The Challenge</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#ai-capabilities" className="hover:text-slate-900 transition-colors">AI Capabilities</a>
            <a href="#categories" className="hover:text-slate-900 transition-colors">Infrastructure</a>
            <a href="#impact" className="hover:text-slate-900 transition-colors">Public Impact</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden"
                  aria-label="User Profile Menu"
                >
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold ${
                    role === 'admin' ? 'bg-slate-900 ring-2 ring-slate-800' : 'bg-blue-600 ring-2 ring-blue-500'
                  }`}>
                    {avatarInitials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">
                      {displayName}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {role === 'admin' ? 'Municipal Officer' : 'Resident Citizen'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {profileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in-50"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        role === 'admin' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {role === 'admin' ? 'Municipal Officer' : 'Resident Citizen'}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={dashboardPath}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                        Go to Dashboard
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={handleReportClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Report Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-800 mb-8 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI for Digital Public Infrastructure & Governance Challenge</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Intelligent Public Infrastructure & Citizen Grievance Redressal
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mt-6 mb-10 leading-relaxed font-normal">
            CivicAI harnesses Google Gemini to triage citizen infrastructure complaints, evaluate real-time hazard severity, deduplicate tickets, and dispatch actionable municipal workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={handleReportClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
            >
              <span>Report an Infrastructure Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/app/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-300 shadow-2xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Municipal Command Portal</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-14 pt-8 border-t border-slate-200/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">100%</div>
              <p className="text-xs text-slate-500 mt-1">Autonomous Gemini AI Triage</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">&lt; 2 hrs</div>
              <p className="text-xs text-slate-500 mt-1">Critical Hazard Dispatch SLA</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">42%</div>
              <p className="text-xs text-slate-500 mt-1">Duplicate Ticket Reduction</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">Geo-GIS</div>
              <p className="text-xs text-slate-500 mt-1">Spatial Mapping & Hotspots</p>
            </div>
          </div>

        </div>
      </section>

      {/* Problem Statement Section */}
      <section id="problem" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">The Municipal Challenge</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              Why Traditional Civic Grievance Portals Fail
            </h2>
            <p className="text-slate-600 mt-4 text-sm sm:text-base leading-relaxed">
              Municipal corporations manage millions of citizens across sprawling wards. Manual reporting pipelines lead to massive bottlenecks, delayed hazard response, and frustrated citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Unranked Ticket Queues</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A dangerous live electrical cable or open manhole gets stuck in the same FIFO queue as a minor graffiti report, risking public injury and fatalities.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Duplicate Ticket Flooding</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When a major road caves in, 50 different citizens report the exact same issue. Field engineers waste hours inspecting identical coordinates.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Opaque Red Tape</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Complaints lack transparent progression tracking, leaving citizens without status updates and creating accountability black holes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Transparent Redressal</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              How CivicAI Redefines Public Governance
            </h2>
            <p className="text-slate-600 mt-4 text-sm sm:text-base leading-relaxed">
              A 4-step digital public infrastructure workflow from instant citizen reporting to verified field resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs relative">
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold mb-4">
                1
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-2">Citizen Geo-Report</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizen submits issue with address, map pin, photo proof, and description in under 60 seconds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs relative">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mb-4">
                2
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-2">Gemini AI Triage</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI categorizes the problem, assigns severity (Low to Critical), identifies affected groups, and calculates urgency score.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs relative">
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold mb-4">
                3
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-2">Municipal Dispatch</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically routes ticket to the exact responsible department with AI-generated step-by-step resolution advice.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs relative">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-4">
                4
              </span>
              <h4 className="text-base font-bold text-slate-900 mb-2">Public Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Progress updates in real-time. Field crews upload resolution verification and citizens confirm closure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capabilities Spotlight */}
      <section id="ai-capabilities" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Under The Hood</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              Gemini AI-Powered Governance Engine
            </h2>
            <p className="text-slate-600 mt-4 text-sm sm:text-base leading-relaxed">
              Purpose-built intelligence models operating strictly on municipal standards and public safety guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Hazard Quantification & Demographic Impact</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Gemini analyzes situational context beyond plain text: proximity to schools, hospitals, transit corridors, and weather forecasts to assign an objective 1-100 urgency score.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="flex justify-between font-mono font-medium">
                  <span>Urgency Metric:</span>
                  <span className="text-red-700 font-bold">92/100 (Critical)</span>
                </div>
                <div className="text-slate-500">
                  Identified vulnerable demographic: <strong>Primary School Children (Morning Peak)</strong>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Spatial Deduplication & Ward Hotspots</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Performs spatial proximity clustering and semantic sentence similarity to identify duplicate complaints, aggregating citizen reports into a single unified incident ticket.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="flex justify-between font-mono font-medium">
                  <span>Spatial Match:</span>
                  <span className="text-purple-700 font-bold">95% Proximity Match</span>
                </div>
                <div className="text-slate-500">
                  Consolidated 7 citizen tickets into parent incident <strong>#CIV-2026-8780</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Categories Grid */}
      <section id="categories" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Civic Coverage</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              Supported Infrastructure Domains
            </h2>
            <p className="text-slate-600 mt-4 text-sm sm:text-base leading-relaxed">
              Comprehensive coverage across key urban and rural digital public infrastructure services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INFRASTRUCTURE_CATEGORIES.map((cat) => {
              const Icon = categoryIcons[cat.id] || Construction;
              return (
                <div key={cat.id} className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{cat.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Measurable Outcomes</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-12">
            Accelerating Civic Redressal Across Metros
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-4xl font-extrabold text-blue-600 font-mono mb-2">64%</div>
              <p className="text-sm font-semibold text-slate-800">Faster Hazard Dispatch</p>
              <p className="text-xs text-slate-500 mt-1">Direct algorithmic routing to technical division engineers.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-4xl font-extrabold text-emerald-600 font-mono mb-2">42%</div>
              <p className="text-sm font-semibold text-slate-800">Duplicate Sprawl Removed</p>
              <p className="text-xs text-slate-500 mt-1">Spatial proximity clustering consolidates repeat complaints.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-4xl font-extrabold text-amber-600 font-mono mb-2">91%</div>
              <p className="text-sm font-semibold text-slate-800">Citizen Satisfaction Score</p>
              <p className="text-xs text-slate-500 mt-1">Real-time status transparency from intake to resolution.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-4xl font-extrabold text-slate-800 font-mono mb-2">100%</div>
              <p className="text-sm font-semibold text-slate-800">Audit Trail Integrity</p>
              <p className="text-xs text-slate-500 mt-1">Immutable timestamps and geotagged photographic proof.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Build Safer, Responsive Municipalities with CivicAI
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Report infrastructure problems directly to municipal authorities or explore the real-time GIS command dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleReportClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Submit a Civic Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to={isAuthenticated ? dashboardPath : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign In to Dashboard'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-900" />
            <span className="font-bold text-slate-900">CivicAI</span>
            <span>— AI for Digital Public Infrastructure & Governance</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/app/citizen" className="hover:text-slate-900">Citizen Portal</Link>
            <Link to="/app/admin" className="hover:text-slate-900">Authority Control</Link>
            <Link to="/login" className="hover:text-slate-900">Login</Link>
            <Link to="/register" className="hover:text-slate-900">Register</Link>
          </div>
        </div>
      </footer>

      {/* Municipal Officer Report Blocker Modal */}
      {showOfficerBlocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setShowOfficerBlocker(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1.5">
                Citizen Account Required
              </h3>
              
              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 mb-3">
                <p className="text-xs font-semibold text-amber-900">
                  Sign in using citizen id to report a complaint
                </p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                You are currently signed in as a <strong>Municipal Officer</strong> ({user?.name || 'Admin'}). Grievance filings must be submitted by verified citizen accounts to accurately link issues to citizen wards and profiles.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleSwitchToCitizenLogin}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Sign In as Citizen</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowOfficerBlocker(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
