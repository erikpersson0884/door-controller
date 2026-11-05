import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextValue {
  authed: boolean | null; // null = still checking
  setAuthed: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/auth/check")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  return (
    <AuthContext.Provider value={{ authed, setAuthed }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}