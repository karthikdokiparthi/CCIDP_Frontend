import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './theme/ThemeContext';
import { AppShell } from './layout/AppShell';
import { AccountPage } from './pages/AccountPage';
import { AuditPage } from './pages/AuditPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { SetSignupPasswordPage } from './pages/SetSignupPasswordPage';
import { SignupPage } from './pages/SignupPage';
import { VerifySignupOtpPage } from './pages/VerifySignupOtpPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RolesPage } from './pages/RolesPage';
import { SessionsPage } from './pages/SessionsPage';
import { SystemPage } from './pages/SystemPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/signup/verify-otp" element={<VerifySignupOtpPage />} />
              <Route path="/signup/set-password" element={<SetSignupPasswordPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/permissions" element={<PermissionsPage />} />
                <Route path="/applications" element={<ClientsPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/system" element={<SystemPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
