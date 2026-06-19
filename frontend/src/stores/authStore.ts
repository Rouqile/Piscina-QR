import { create } from "zustand";
import type { UserMe } from "@/types";

interface AuthState {
  token: string | null;
  user: UserMe | null;
  hydrated: boolean;
  hydrate: () => void;
  setAuth: (token: string, user: UserMe) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    const token = sessionStorage.getItem("access_token");
    const userStr = sessionStorage.getItem("user");
    set({
      token,
      user: userStr ? JSON.parse(userStr) : null,
      hydrated: true,
    });
  },
  setAuth: (token, user) => {
    sessionStorage.setItem("access_token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    set({ token: null, user: null });
  },
  isAdmin: () => get().user?.rol === "admin",
}));
