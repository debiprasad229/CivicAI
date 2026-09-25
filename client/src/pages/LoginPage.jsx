import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, ArrowRight, ShieldCheck, UserCheck, Lock, Mail, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from a protected route
  const from = location.state?.from?.pathname;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
  };

  const handleFillDemo = () => {
    if (selectedRole === 'admin') {
      setEmail('commissioner@metro.gov.in');
      setPassword('adminpassword123');
    } else {
      setEmail('rohan.sharma@example.com');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      const userRole = res.user?.role || selectedRole;
      
      // Navigate to intended page or default role home
      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'admin') {
        navigate('/app/admin', { replace: true });
      } else {
        navigate('/app/citizen', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">CivicAI</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Sign In to CivicAI Platform
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access the AI-powered municipal infrastructure and citizen portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10 shadow-xs border border-slate-200 sm:rounded-2xl">
          
          {/* Quick Demo Role Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Select Persona
              </label>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Auto-fill demo credentials
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('citizen')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'citizen'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-950 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <UserCheck className={`w-4 h-4 ${selectedRole === 'citizen' ? 'text-blue-600' : 'text-slate-400'}`} />
                  {selectedRole === 'citizen' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </div>
                <div className="font-semibold text-xs">Resident Citizen</div>
                <div className="text-[10px] text-slate-500">Report & track issues</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'admin'
                    ? 'border-slate-900 bg-slate-900 text-white ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <ShieldCheck className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-white' : 'text-slate-400'}`} />
                  {selectedRole === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                <div className="font-semibold text-xs">Municipal Official</div>
                <div className={`text-[10px] ${selectedRole === 'admin' ? 'text-slate-300' : 'text-slate-500'}`}>Triage & dispatch</div>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official / Citizen Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={selectedRole === 'admin' ? "municipal.gov.in" : "name@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Min. 6 chars</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {selectedRole === 'admin' ? 'Municipal Official' : 'Citizen'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have a verified citizen profile?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
