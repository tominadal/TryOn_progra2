"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchApi } from "@/lib/api";

interface User {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return Boolean(localStorage.getItem("token"));
  });

  const fetchUser = useCallback(async () => {
    try {
      const userData = await fetchApi("/users/me");
      setUser(userData);
    } catch (error: unknown) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchApi("/users/me")
      .then((userData) => setUser(userData))
      .catch((error: unknown) => {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (token: string) => {
    localStorage.setItem("token", token);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
