import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/api/client';
import { authApi } from '@/api/endpoints';
import { AuthContext } from '@/hooks/useAuth';
import type { User } from '@/types/api';

/** Loads the current session once (GET /auth/me) and shares it through useAuth(). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch((err: unknown) => {
        // 401 just means "not logged in"; anything else we also treat as logged out.
        if (active) setUser(null);
        if (!(err instanceof ApiError && err.status === 401)) console.error(err);
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return <AuthContext value={{ user, setUser, logout }}>{children}</AuthContext>;
}
