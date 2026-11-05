import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Only for logged-in users. Sends everyone else to /login.
export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { authed } = useAuth();
  if (authed === null) return null; // still checking with the server
  return authed ? children : <Navigate to="/login" replace />;
}

// Only for logged-out users (the login page). Sends logged-in users to /.
export function PublicRoute({ children }: { children: ReactElement }) {
  const { authed } = useAuth();
  if (authed === null) return null;
  return authed ? <Navigate to="/" replace /> : children;
}
