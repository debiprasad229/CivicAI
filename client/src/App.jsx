import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Code-split pages with React.lazy for instant bundle loading (<200ms initial load)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const SubmitComplaintPage = lazy(() => import('./pages/SubmitComplaintPage'));
const MyComplaintsPage = lazy(() => import('./pages/MyComplaintsPage'));
const ComplaintDetailsPage = lazy(() => import('./pages/ComplaintDetailsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminComplaintsPage = lazy(() => import('./pages/AdminComplaintsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));

// Ultra-fast lightweight page fallback loader
function PageLoader() {
  return (
    <div className="min-h-[350px] w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
      <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-3" />
      <p className="text-xs font-semibold text-slate-600">Loading module...</p>
    </div>
  );
}

// Helper component to route /app to appropriate role home
function AppIndexRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === 'admin' ? '/app/admin' : '/app/citizen'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Application Shell */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AppIndexRedirect />} />

              {/* Citizen Routes - Accessible by Citizens and Admins */}
              <Route
                path="citizen"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="citizen/submit"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <SubmitComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="citizen/complaints"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <MyComplaintsPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Incident Dossier */}
              <Route
                path="complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <ComplaintDetailsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Only Municipal Routes - Strictly Forbidden for Citizens */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/complaints"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminComplaintsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback to Public Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
