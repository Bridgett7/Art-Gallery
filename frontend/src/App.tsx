import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import frFR from 'antd/locale/fr_FR';
import enUS from 'antd/locale/en_US';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Artworks from './pages/Artworks';
import Events from './pages/Events';
import Marketplace from './pages/Marketplace';
import Orders from './pages/Orders';
import Courses from './pages/Courses';
import Planning from './pages/Planning';
import Notifications from './pages/Notifications';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        {/* Placeholder routes for future modules */}
        <Route path="artworks" element={<Artworks />} />
        <Route path="events" element={<Events />} />
        <Route path="courses" element={<Courses />} />
        <Route path="planning" element={<Planning />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  const antLocale = i18n.language === 'fr' ? frFR : enUS;

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{
        token: {
          colorPrimary: '#2B3A67',
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
}
