import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Verifying civic credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access control (RBAC)
  if (allowedRoles && !allowedRoles.includes(role)) {
    // If citizen tries to access admin, redirect to citizen dashboard
    if (role === 'citizen') {
      return <Navigate to="/app/citizen" replace />;
    }
    // If admin tries to access citizen-only, redirect to admin command center
    return <Navigate to="/app/admin" replace />;
  }

  return children;
}
