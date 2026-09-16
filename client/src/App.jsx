import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockAuthProvider, useAuth } from './context/MockAuthContext';
import AppLayout from './layouts/AppLayout';

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
    <MockAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated / App Shell Routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppIndexRedirect />} />

            {/* Citizen Routes */}
            <Route path="citizen" element={<CitizenDashboard />} />
            <Route path="citizen/submit" element={<SubmitComplaintPage />} />
            <Route path="citizen/complaints" element={<MyComplaintsPage />} />

            {/* Shared Complaint Dossier */}
            <Route path="complaints/:id" element={<ComplaintDetailsPage />} />

            {/* Admin Municipal Routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
          </Route>

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MockAuthProvider>
  );
}
