import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextValue {
  authed: boolean | null; // null = still checking
  adminAuthed: boolean | null;
  setAuthed: (value: boolean) => void;
  setAdminAuthed: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([fetch("/auth/check"), fetch("/admin/auth/check")])
      .then(([doorResponse, adminResponse]) => {
        setAuthed(doorResponse.ok);
        setAdminAuthed(adminResponse.ok);
      })
      .catch(() => {
        setAuthed(false);
        setAdminAuthed(false);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authed,
        adminAuthed,
        setAuthed,
        setAdminAuthed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}