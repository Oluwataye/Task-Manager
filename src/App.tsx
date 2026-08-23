import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AllTasks } from './pages/AllTasks';
import { MyTasks } from './pages/MyTasks';
import { CalendarView } from './pages/CalendarView';
import { Reports } from './pages/Reports';
import { UserManagement } from './pages/UserManagement';
import { PropertiesPage } from './pages/PropertiesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AssetsPage } from './pages/AssetsPage';
import { InvoicesPage } from './pages/InvoicesPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading Task Monitoring System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="all-tasks" element={<AllTasks />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
