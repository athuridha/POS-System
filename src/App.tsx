import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { usePaymentGatewayStore } from './stores/paymentGatewayStore';
import { initSyncEngine } from './lib/sync';
import { AppLayout } from './components/layout/AppLayout';
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Public Customer Self-Service Table Order */}
            <Route path="/order/:tableId" element={<PublicOrderPage />} />

            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route path="/pos" element={<PosPage />} />
              <Route path="/kds" element={<KdsPage />} />
              <Route path="/shifts" element={<ShiftPage />} />
              <Route path="/history" element={<TransactionHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Super Admin / Manager routes */}
              <Route
                path="/dashboard"
                element={
                  <AdminOrManagerGuard>
                    <DashboardPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/table-qr"
                element={
                  <AdminOrManagerGuard>
                    <TableQrPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/users"
                element={
                  <AdminOrManagerGuard>
                    <UserManagementPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/menu"
                element={
                  <AdminOrManagerGuard>
                    <MenuManagementPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/tables"
                element={
                  <AdminOrManagerGuard>
                    <TableManagementPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/discounts"
                element={
                  <AdminOrManagerGuard>
                    <DiscountPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/reports"
                element={
                  <AdminOrManagerGuard>
                    <ReportsPage />
                  </AdminOrManagerGuard>
                }
              />
              <Route
                path="/payment-gateway"
                element={
                  <AdminOrManagerGuard>
                    <PaymentGatewayPage />
                  </AdminOrManagerGuard>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </AppInit>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
