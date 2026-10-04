import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiJson, setToken, getToken } from "../lib/api";

export type UiRole = "admin" | "faculty" | "student" | "organiser";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  uiRole: UiRole;
  divisionId: number | null;
  departmentId: number | null;
};

export function apiRoleToUiRole(apiRole: string): UiRole {
  if (apiRole === "event_organiser") return "organiser";
  if (apiRole === "admin" || apiRole === "faculty" || apiRole === "student") return apiRole;
  return "student";
}

export function dashboardPathForUiRole(r: UiRole): string {
  switch (r) {
    case "admin":
      return "/admin";
    case "faculty":
      return "/faculty";
    case "student":
      return "/student";
    case "organiser":
      return "/organiser";
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ id: number; email: string; fullName: string; role: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiJson<{
        id: number;
        email: string;
        fullName: string;
        role: string;
        divisionId: number | null;
        departmentId: number | null;
      }>("/auth/me");
      setUser({
        ...me,
        uiRole: apiRoleToUiRole(me.role),
      });
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiJson<{ token: string; user: { id: number; email: string; fullName: string; role: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }), skipAuth: true }
    );
    setToken(res.token);
    await refreshMe();
    return res.user;
  }, [refreshMe]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshMe }),
    [user, loading, login, logout, refreshMe]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const x = useContext(Ctx);
  if (!x) throw new Error("useAuth outside AuthProvider");
  return x;
}
