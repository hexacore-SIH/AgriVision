"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Language, Role } from "@agrivision/shared-types";
import { apiJson, setAccessToken, setUnauthorizedHandler, tryRefresh } from "./apiClient";

export interface CurrentUser {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  preferredLanguage: Language;
  mandiId: string | null;
}

interface AuthContextValue {
  user: CurrentUser | null;
  initializing: boolean;
  requestOtp: (phone: string) => Promise<{ devOtp?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    (async () => {
      try {
        const token = await tryRefresh();
        if (token) {
          setAccessToken(token);
          const me = await apiJson<CurrentUser>("/auth/me");
          setUser(me);
        }
      } catch {
        // not logged in
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    return apiJson<{ message: string; devOtp?: string }>("/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const data = await apiJson<{ accessToken: string; user: CurrentUser }>(
      "/auth/otp/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      }
    );
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiJson("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<CurrentUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, requestOtp, verifyOtp, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
