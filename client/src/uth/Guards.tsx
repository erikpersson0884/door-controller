import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { authed } = useAuth();
  if (authed === null) return null;
  return authed ? children : <Navigate to="/login" replace />;
}

export function PublicRoute({ children }: { children: ReactElement }) {
  const { authed } = useAuth();
  if (authed === null) return null;
  return authed ? <Navigate to="/" replace /> : children;
}
