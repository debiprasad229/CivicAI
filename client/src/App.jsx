import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaintsPage from './pages/AdminComplaintsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

// Helper component to route /app to appropriate role home
function AppIndexRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === 'admin' ? '/app/admin' : '/app/citizen'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}
