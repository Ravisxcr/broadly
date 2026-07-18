"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AVATAR_COLORS } from "../data";
import type { AuthUser, Member, Role } from "../types";
import { authClient } from "../../auth-client";
import { fetchMembers, updateMemberRole as updateMemberRoleRequest } from "../api";

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
  /** Every registered account, each with its current admin/member role. */
  registeredUsers: AuthUser[];
  currentUserId: string | null;
  currentUser: Member | undefined;
  isAdmin: boolean;
  logout(): void;
  removeMember(memberId: string): void;
  updateMemberRole(userId: string, role: Role): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Members hidden from the roster this session (removeMember is local-only,
  // like the rest of this roster — nothing here is persisted server-side).
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  // Optimistic role overrides so a role change shows immediately, ahead of
  // the "members" query refetch triggered below.
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Role>>({});
  const queryClient = useQueryClient();

  const { data: session, refetch: refetchSession } = authClient.useSession();
  const { data: registeredUsers } = useQuery({ queryKey: ["members"], queryFn: fetchMembers, enabled: !!session?.user });

  // Anyone who signs in is a real account (via Better Auth) and shows up here
  // automatically — no explicit "add" step. They still can't see any
  // board/workspace until an admin grants access below.
  const roster: Member[] = useMemo(
    () =>
      (registeredUsers ?? [])
        .filter((u) => !removedIds.has(u.id))
        .map((u, i) => ({
          id: u.id,
          initials: initialsFor(u.name),
          name: u.name,
          email: u.email,
          color: AVATAR_COLORS[i % AVATAR_COLORS.length],
          role: roleOverrides[u.id] ?? u.role,
        })),
    [registeredUsers, removedIds, roleOverrides]
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
            role: (sessionUser.role as Role | undefined) ?? "member",
          }
        : undefined,
    [sessionUser]
  );

  const isAdmin = !!currentUser && currentUser.role === "admin";

  const logout = async () => {
    await authClient.signOut();
  };

  const removeMember = (memberId: string) => {
    setRemovedIds((ids) => new Set(ids).add(memberId));
  };

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: Role }) => updateMemberRoleRequest(vars.userId, vars.role),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setRoleOverrides((overrides) => ({ ...overrides, [updatedUser.id]: updatedUser.role }));
      // The role write goes straight to the `user` collection, bypassing Better
      // Auth's own update flow, so nothing else tells this session to refetch.
      // If an admin changed their own role, pick that up immediately instead of
      // waiting for the next focus/visibility-triggered session refetch.
      if (updatedUser.id === currentUserId) refetchSession();
    },
  });

  const updateMemberRole = useCallback(
    (userId: string, role: Role) => roleMutation.mutateAsync({ userId, role }).then(() => undefined),
    [roleMutation]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ roster, registeredUsers: registeredUsers ?? [], currentUserId, currentUser, isAdmin, logout, removeMember, updateMemberRole }),
    [roster, registeredUsers, currentUserId, currentUser, isAdmin, updateMemberRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
