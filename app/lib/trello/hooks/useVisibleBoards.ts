"use client";

import { useMemo } from "react";
import { canAccessBoard } from "../data";
import type { BoardData } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useBoards } from "../contexts/BoardsContext";
import { useWorkspaces } from "../contexts/WorkspacesContext";

// Role-filtered board list shared by Sidebar and DashboardView. AdminView must
// keep using useBoards().boards directly — the access-control screen needs the
// unfiltered list.
export function useVisibleBoards(): BoardData[] {
  const { boards } = useBoards();
  const { workspaces } = useWorkspaces();
  const { currentUserId, isAdmin } = useAuth();

  return useMemo(
    () => (isAdmin ? boards : boards.filter((b) => currentUserId != null && canAccessBoard(b, workspaces, currentUserId, false))),
    [boards, workspaces, currentUserId, isAdmin]
  );
}
