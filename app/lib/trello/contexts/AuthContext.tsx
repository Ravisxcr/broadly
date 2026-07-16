"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AVATAR_COLORS, DEFAULT_ROSTER } from "../data";
import type { Member } from "../types";
import { authClient } from "../../auth-client";

const SESSION_STORAGE_KEY = "boardly:currentUserId";

function readStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

interface AuthContextValue {
  roster: Member[];
  currentUserId: string | null;
  currentUser: Member | undefined;
  isAdmin: boolean;
  login(userId: string): void;
  logout(): void;
  inviteMember(name: string, email: string): void;
  removeMember(memberId: string): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roster, setRoster] = useState<Member[]>(() => DEFAULT_ROSTER.map((m) => ({ ...m })));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const stored = readStoredUserId();
    if (stored) setCurrentUserId(stored);
  }, []);

  // Use the mock user from roster if present
  let currentUser = roster.find((m) => m.id === currentUserId);
  
  // Or override with the real authenticated user
  if (session?.user) {
    currentUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      initials: session.user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase(),
      color: "#4F46E5",
      role: "member",
    };
  }

  const isAdmin = !!currentUser && currentUser.role === "admin";

  const login = (userId: string) => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, userId);
    setCurrentUserId(userId);
  };

  const logout = async () => {
    await authClient.signOut();
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUserId(null);
  };

  const inviteMember = (name: string, email: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const initials = trimmedName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    setRoster((r) => {
      const color = AVATAR_COLORS[r.length % AVATAR_COLORS.length];
      const newMember: Member = { id: "u" + Date.now(), initials, name: trimmedName, email: email.trim() || "—", color, role: "member" };
      return [...r, newMember];
    });
  };

  const removeMember = (memberId: string) => {
    setRoster((r) => r.filter((m) => m.id !== memberId));
  };

  const value = useMemo<AuthContextValue>(
    () => ({ roster, currentUserId, currentUser, isAdmin, login, logout, inviteMember, removeMember }),
    [roster, currentUserId, currentUser, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
