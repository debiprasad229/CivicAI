import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, ShieldCheck, UserCheck, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/MockAuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('rohan.sharma@example.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('citizen');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('commissioner@metro.gov.in');
    } else {
      setEmail('rohan.sharma@example.com');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password, selectedRole);
    if (selectedRole === 'admin') {
      navigate('/app/admin');
    } else {
      navigate('/app/citizen');
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
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Select Demo Persona
            </label>
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
                <a href="#" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Sign In as {selectedRole === 'admin' ? 'Municipal Official' : 'Citizen'}</span>
                <ArrowRight className="w-4 h-4" />
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
