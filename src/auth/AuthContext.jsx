import { createContext, useContext, useMemo, useState } from "react";
import { AuthStore } from "./authStore";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => AuthStore.getSession()?.user || null);

  const value = useMemo(() => {
    return {
      user,
      isAuthed: !!user,
      signUp: async (payload) => AuthStore.signUp(payload),
      signIn: async (payload) => {
        const u = AuthStore.signIn(payload);
        setUser(u);
        return u;
      },
      signOut: () => {
        AuthStore.signOut();
        setUser(null);
      },
    };
  }, [user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}