import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui/States';

/** Only signed-in users get past this; others go to /login and come back after. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader label="Checking your session…" />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Login/Register: signed-in users are sent straight to the dashboard. */
export function GuestRoute() {
  const { status } = useAuth();
  if (status === 'loading') return <PageLoader label="Checking your session…" />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
