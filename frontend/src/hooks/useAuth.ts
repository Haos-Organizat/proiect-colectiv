import { createContext, use } from 'react';
import type { User } from '@/types/api';

export interface AuthContextValue {
  /** undefined while the session is being checked, null when logged out. */
  user: User | null | undefined;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
