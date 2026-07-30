import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
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
    return <Navigate to="/pos" replace />;
  }
  return <>{children}</>;
}

function AppInit({ children }: { children: React.ReactNode }) {
  const { loadFromStorage: loadAuth } = useAuthStore();
  const { loadFromStorage: loadSettings } = useSettingsStore();
  const { loadFromStorage: loadGateway } = usePaymentGatewayStore();

  useEffect(() => {
    loadAuth();
    loadSettings();
    loadGateway();

    const cleanup = initSyncEngine();
    return cleanup;
  }, [loadAuth, loadSettings, loadGateway]);

  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuthStore();
  if (user?.role === 'kasir') return <Navigate to="/pos" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
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
  );
}
