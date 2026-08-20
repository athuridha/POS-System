import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { usePaymentGatewayStore } from './stores/paymentGatewayStore';
import { initSyncEngine } from './lib/sync';
import { PosLayout } from './components/layout/PosLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import MenuManagementPage from './pages/MenuManagementPage';
import TableManagementPage from './pages/TableManagementPage';
import ShiftPage from './pages/ShiftPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import ReportsPage from './pages/ReportsPage';
import DiscountPage from './pages/DiscountPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import PaymentGatewayPage from './pages/PaymentGatewayPage';
import DashboardPage from './pages/DashboardPage';
import KdsPage from './pages/KdsPage';
import TableQrPage from './pages/TableQrPage';
import PublicOrderPage from './pages/PublicOrderPage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-zinc-950 text-white font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-white">Terjadi Kendala Sistem</h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              {this.state.error?.message || 'Terjadi kesalahan saat memuat tampilan.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Muat Ulang
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/login';
                }}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer border border-zinc-700"
              >
                Halaman Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOrManagerGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.role !== 'manager' && user?.role !== 'super_admin') {
    if (user?.role === 'dapur') return <Navigate to="/kds" replace />;
    return <Navigate to="/pos" replace />;
  }
  return <>{children}</>;
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { loadFromStorage: loadAuth } = useAuthStore();
  const { loadFromStorage: loadSettings, fetchSettingsFromDatabase, namaCafe, logoUrl } = useSettingsStore();
  const { loadFromStorage: loadGateway } = usePaymentGatewayStore();

  useEffect(() => {
    loadAuth();
    loadSettings();
    fetchSettingsFromDatabase();
    loadGateway();

    const cleanup = initSyncEngine();
    return cleanup;
  }, [loadAuth, loadSettings, fetchSettingsFromDatabase, loadGateway]);

  // Dynamically update browser tab title and favicon
  useEffect(() => {
    if (namaCafe && namaCafe.trim()) {
      document.title = namaCafe.trim();
    }
    if (logoUrl && logoUrl.trim()) {
      let favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.id = 'app-favicon';
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = logoUrl;
    }
  }, [namaCafe, logoUrl]);

  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuthStore();
  if (user?.role === 'dapur') return <Navigate to="/kds" replace />;
  if (user?.role === 'kasir') return <Navigate to="/pos" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppInit>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Public Customer Self-Service Table Order */}
              <Route path="/order/:tableId" element={<PublicOrderPage />} />

              {/* 1. Pos / Operational Layout */}
              <Route
                element={
                  <AuthGuard>
                    <PosLayout />
                  </AuthGuard>
                }
              >
                <Route path="/pos" element={<PosPage />} />
                <Route path="/kds" element={<KdsPage />} />
                <Route path="/shifts" element={<ShiftPage />} />
                <Route path="/history" element={<TransactionHistoryPage />} />
              </Route>

              {/* 2. Executive Manager & SuperAdmin Layout */}
              <Route
                element={
                  <AuthGuard>
                    <AdminOrManagerGuard>
                      <DashboardLayout />
                    </AdminOrManagerGuard>
                  </AuthGuard>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/table-qr" element={<TableQrPage />} />
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/menu" element={<MenuManagementPage />} />
                <Route path="/tables" element={<TableManagementPage />} />
                <Route path="/discounts" element={<DiscountPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/payment-gateway" element={<PaymentGatewayPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </AppInit>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
