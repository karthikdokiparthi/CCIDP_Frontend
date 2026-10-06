import { Navigate, useLocation } from 'react-router-dom';
import { isVoluntaryLogout, peekSessionExpired } from '../api/client';
import { allowedAppPath, isSettingsPath, hasDirectoryAdminRole } from '../utils/destinations';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="boot">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, expired: !isVoluntaryLogout() && peekSessionExpired() }}
      />
    );
  }

  if (!hasDirectoryAdminRole(user) && !isSettingsPath(location.pathname)) {
    return <Navigate to={allowedAppPath(user, location.pathname)} replace />;
  }

  return children;
}
