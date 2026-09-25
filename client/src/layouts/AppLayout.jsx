import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  Map, 
  Shield, 
  Menu, 
  X, 
  Bell, 
  Search, 
  LogOut, 
  User, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isCitizen = role === 'citizen';
  const isAdmin = role === 'admin';

  const displayName = user?.name || (isAdmin ? 'Dr. Neha Kapoor (IAS)' : 'Rohan Sharma');
  const displayEmail = user?.email || (isAdmin ? 'commissioner@metro.gov.in' : 'citizen@civic.gov');
  const displayWard = user?.ward || (isAdmin ? 'Central Command Headquarters' : 'Ward 14 (Central)');
  const avatarInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const citizenNav = [
    { name: 'Dashboard', path: '/app/citizen', icon: LayoutDashboard },
    { name: 'Submit Complaint', path: '/app/citizen/submit', icon: PlusCircle },
    { name: 'My Complaints', path: '/app/citizen/complaints', icon: FileText }
  ];

  const adminNav = [
    { name: 'Command Center', path: '/app/admin', icon: LayoutDashboard },
    { name: 'All Complaints', path: '/app/admin/complaints', icon: Layers },
    { name: 'City Analytics', path: '/app/admin/analytics', icon: BarChart3 }
  ];

  const currentNav = isCitizen ? citizenNav : adminNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-slate-900">CivicAI</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                    GovTech
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 hidden sm:block">
                  Digital Public Infrastructure
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search & Quick Context */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search complaints, wards, ticket ID..."
                className="w-full bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-hidden"
              />
            </div>
          </div>

          {/* Right: Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button 
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                  {avatarInitials}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{displayName}</div>
                  <div className="text-[10px] text-slate-500 leading-tight capitalize">
                    {role === 'admin' ? 'Municipal Officer' : 'Resident Citizen'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {displayWard}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/"
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      Public Landing Page
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main App Body with Sidebar */}
      <div className="flex-1 flex">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0">
          {/* Active Persona Banner */}
          <div className="p-4 border-b border-slate-100">
            <div className={`p-3 rounded-lg border ${isCitizen ? 'bg-blue-50/70 border-blue-100' : 'bg-slate-900 text-white border-slate-800'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isCitizen ? 'text-blue-700' : 'text-slate-300'}`}>
                  {isCitizen ? 'Citizen Portal' : 'Authority Control'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isCitizen ? 'bg-blue-500' : 'bg-emerald-400'}`}></span>
              </div>
              <p className={`text-xs ${isCitizen ? 'text-blue-950 font-medium' : 'text-slate-200 font-medium'}`}>
                {isCitizen ? 'Lodge & track community reports' : 'Triage, maps & resolution dispatch'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {currentNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app/citizen' || item.path === '/app/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {isCitizen && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                <NavLink
                  to="/app/citizen/submit"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Infrastructure Issue</span>
                </NavLink>
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Gemini AI 2.0 Triage
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-900" />
                  <span className="font-bold text-slate-900">CivicAI Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {currentNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      end={item.path === '/app/citizen' || item.path === '/app/admin'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
