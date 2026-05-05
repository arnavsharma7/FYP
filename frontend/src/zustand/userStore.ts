"use client";

import { create } from "zustand";

const TOKEN_STORAGE_KEY = "token";
const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const USER_STORAGE_KEY = "authUser";
const AUTH_BASE = (process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5000/auth").replace(/\/+$/, "");

export type AuthUser = {
  id?: string;
  email?: string;
  fullName?: string;
  phone?: string | null;
  role?: "tourist" | "provider" | "admin";
};

type UserState = {
  hasHydrated: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  hydrateFromStorage: () => void;
  fetchMe: () => Promise<void>;
  setAuthenticated: (token?: string | null, user?: AuthUser | null) => void;
  logout: () => void;
};

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  return (
    window.localStorage.getItem(TOKEN_STORAGE_KEY) ||
    window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  );
}

function persistAuth(token: string, user: AuthUser | null) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);

  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function clearStoredAuth() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export const useUserStore = create<UserState>((set) => ({
  hasHydrated: false,
  isAuthenticated: false,
  token: null,
  user: null,

  hydrateFromStorage: () => {
    const token = getStoredToken();
    const user = getStoredUser();

    set({
      hasHydrated: true,
      isAuthenticated: Boolean(token),
      token,
      user: token ? user : null,
    });
  },

  fetchMe: async () => {
    const token = getStoredToken();

    if (!token) {
      clearStoredAuth();

      set({
        hasHydrated: true,
        isAuthenticated: false,
        token: null,
        user: null,
      });

      return;
    }

    try {
      const res = await fetch(`${AUTH_BASE}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Invalid token");
      }

      const data = await res.json();
      const user = data.data.user as AuthUser;

      persistAuth(token, user);

      set({
        hasHydrated: true,
        isAuthenticated: true,
        token,
        user,
      });
    } catch (error) {
      console.error("Auth fetch failed:", error);

      clearStoredAuth();

      set({
        hasHydrated: true,
        isAuthenticated: false,
        token: null,
        user: null,
      });
    }
  },

  setAuthenticated: (token = null, user = null) => {
    if (typeof window !== "undefined") {
      if (token) {
        persistAuth(token, user);
      } else {
        clearStoredAuth();
      }
    }

    set({
      hasHydrated: true,
      isAuthenticated: Boolean(token),
      token,
      user: token ? user : null,
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      clearStoredAuth();
    }

    set({
      hasHydrated: true,
      isAuthenticated: false,
      token: null,
      user: null,
    });
  },
}));
