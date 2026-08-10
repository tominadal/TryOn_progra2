"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  login: (token: string, rememberMe?: boolean) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check both storages
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await fetchApi("/users/me");
      setUser(userData);
    } catch (error: any) {
      if (error.message !== "Could not validate credentials") {
        console.error("Failed to fetch user:", error);
      }
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem("token", token);
      sessionStorage.removeItem("token");
    } else {
      sessionStorage.setItem("token", token);
      localStorage.removeItem("token");
    }
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
