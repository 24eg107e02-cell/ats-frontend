import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, AuthResponse, Role, setUnauthorizedHandler, tokenStore } from './api';

export interface User { userId: number; email: string; fullName: string; role: Role }

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (b: { email: string; password: string; fullName: string; phone?: string; role: Role }) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

const toUser = (r: AuthResponse): User => ({ userId: r.userId, email: r.email, fullName: r.fullName, role: r.role });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = () => { tokenStore.clear(); setUser(null); };

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api.me().then((r) => setUser(toUser(r))).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const accept = (r: AuthResponse) => {
    if (r.token) tokenStore.set(r.token);
    const u = toUser(r);
    setUser(u);
    return u;
  };

  return (
    <Ctx.Provider
      value={{
        user, loading, logout,
        login: async (email, password) => accept(await api.login(email, password)),
        register: async (b) => accept(await api.register(b)),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
