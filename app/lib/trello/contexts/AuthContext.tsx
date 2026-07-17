"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AVATAR_COLORS, DEFAULT_ROSTER } from "../data";
import type { AuthUser, Member } from "../types";
import { authClient } from "../../auth-client";
import { fetchMembers } from "../api";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AuthContextValue {
  roster: Member[];
  /** Registered accounts (from the auth provider) not yet added to the roster. */
  availableUsers: AuthUser[];
  currentUserId: string | null;
  currentUser: Member | undefined;
  isAdmin: boolean;
  logout(): void;
  addMember(user: AuthUser): void;
  removeMember(memberId: string): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roster, setRoster] = useState<Member[]>(() => DEFAULT_ROSTER.map((m) => ({ ...m })));

  const { data: session } = authClient.useSession();
  const { data: registeredUsers } = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  const availableUsers = (registeredUsers ?? []).filter(
    (u) => !roster.some((m) => m.email.toLowerCase() === u.email.toLowerCase())
  );

  const currentUserId = session?.user?.id ?? null;

  const sessionUser = session?.user;
  const currentUser: Member | undefined = useMemo(
    () =>
      sessionUser
        ? {
            id: sessionUser.id,
            name: sessionUser.name,
            email: sessionUser.email,
            initials: initialsFor(sessionUser.name),
            color: "#4F46E5",
            role: "member",
          }
        : undefined,
    [sessionUser]
  );

  const isAdmin = !!currentUser && currentUser.role === "admin";

  const logout = async () => {
    await authClient.signOut();
  };

  const addMember = (user: AuthUser) => {
    setRoster((r) => {
      if (r.some((m) => m.id === user.id)) return r;
      const color = AVATAR_COLORS[r.length % AVATAR_COLORS.length];
      const newMember: Member = { id: user.id, initials: initialsFor(user.name), name: user.name, email: user.email, color, role: "member" };
      return [...r, newMember];
    });
  };

  const removeMember = (memberId: string) => {
    setRoster((r) => r.filter((m) => m.id !== memberId));
  };

  const value = useMemo<AuthContextValue>(
    () => ({ roster, availableUsers, currentUserId, currentUser, isAdmin, logout, addMember, removeMember }),
    [roster, availableUsers, currentUserId, currentUser, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
