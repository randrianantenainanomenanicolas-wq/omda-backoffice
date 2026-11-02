import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as authService from '@/services/auth.service';
import type { Utilisateur } from '@/types/models';

interface AuthState {
  session: Session | null;
  profile: Utilisateur | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Utilisateur | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    authService.getSession().then(setSession).catch(() => setSession(null)).finally(() => setSessionReady(true));
    // Pas d'appel Supabase dans ce callback (risque de blocage) : on met seulement la session à jour.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!sessionReady) return;
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    let cancelled = false;
    setProfileReady(false);
    authService
      .fetchProfile(userId)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null))
      .finally(() => !cancelled && setProfileReady(true));
    return () => { cancelled = true; };
  }, [userId, sessionReady]);

  const signIn = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
  }, []);
  const signOut = useCallback(async () => {
    await authService.logout();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userId) setProfile(await authService.fetchProfile(userId));
  }, [userId]);

  const value = useMemo<AuthState>(
    () => ({ session, profile, loading: !sessionReady || !profileReady, signIn, signOut, refreshProfile }),
    [session, profile, sessionReady, profileReady, signIn, signOut, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return ctx;
}
