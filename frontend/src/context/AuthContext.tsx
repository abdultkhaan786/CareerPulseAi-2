import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setUnauthorizedHandler, tokenStore } from "@/lib/api";
import type { User } from "@/lib/types";
import { keys } from "@/hooks/queries";
import { useToast } from "./ToastContext";

interface AuthValue {
  user: User | null;
  /** True until we know whether a stored session is valid */
  checking: boolean;
  /** Set when a stored session couldn't be verified for a reason other than being invalid (e.g. server down) */
  sessionError: Error | null;
  retrySession: () => void;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(() => tokenStore.get());

  const me = useQuery({
    queryKey: keys.me,
    queryFn: () => api.auth.me(),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
    retry: (count, err) => (err as { status?: number }).status !== 401 && count < 2
  });

  const clearSession = useCallback(() => {
    tokenStore.set(null);
    setToken(null);
    qc.removeQueries({ queryKey: keys.me });
    qc.removeQueries({ queryKey: ["recommendations"] });
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      toast({ tone: "error", title: "Session expired", description: "Log in again to continue." });
    });
  }, [clearSession, toast]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.login({ email, password });
      tokenStore.set(res.token);
      const { user } = await api.auth.me();
      qc.setQueryData(keys.me, { user });
      setToken(res.token);
      return user;
    },
    [qc]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await api.auth.register({ name, email, password });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearSession();
    toast({ title: "Signed out" });
  }, [clearSession, toast]);

  const value = useMemo<AuthValue>(
    () => ({
      user: token ? me.data?.user ?? null : null,
      checking: Boolean(token) && me.isPending,
      sessionError: token && me.isError ? (me.error as Error) : null,
      retrySession: () => void me.refetch(),
      login,
      register,
      logout
    }),
    [token, me, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Whether the signed-in user may edit/delete a job (mirrors the backend rule; the backend enforces it). */
export function canManageJob(user: User | null, postedBy: unknown) {
  if (!user) return false;
  if (user.isAdmin) return true;
  const ownerId = postedBy && typeof postedBy === "object" ? (postedBy as { _id: string })._id : postedBy;
  return Boolean(ownerId) && String(ownerId) === String(user.id);
}
