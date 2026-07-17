"use client";

import { useEffect, type MutableRefObject } from "react";
import { canAccessBoard, findCardListId } from "../data";
import { buildUrl, parseUrlTarget } from "../url";
import type { BoardData, WorkspaceData } from "../types";

export interface NavState {
  view: "dashboard" | "board" | "admin";
  activeBoardId: string | null;
  selectedCardId: string | null;
  selectedListId: string | null;
}

interface UrlSyncRouter {
  replace: (href: string) => void;
}

interface UseUrlSyncParams {
  pathname: string;
  searchParams: URLSearchParams;
  router: UrlSyncRouter;
  skipUrlSyncRef: MutableRefObject<boolean>;
  currentUserId: string | null;
  isAdmin: boolean;
  boards: BoardData[];
  workspaces: WorkspaceData[];
  boardsLoading: boolean;
  workspacesLoading: boolean;
  navState: NavState;
  updateNav: (patch: Partial<NavState>) => void;
}

// Reconciles state with the URL for navigations we didn't drive ourselves
// (initial load / deep link, browser back-forward, or a board/card that stopped
// being valid). Skips the run its own navigate() calls provoke via skipUrlSyncRef.
export function useUrlSync(params: UseUrlSyncParams): void {
  const {
    pathname,
    searchParams,
    router,
    skipUrlSyncRef,
    currentUserId,
    isAdmin,
    boards,
    workspaces,
    boardsLoading,
    workspacesLoading,
    navState,
    updateNav,
  } = params;

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    if (!currentUserId) return;
    if (boardsLoading || workspacesLoading) return;

    const target = parseUrlTarget(pathname, searchParams);

    if (target.view === "admin") {
      if (!isAdmin) {
        router.replace(buildUrl("dashboard", null, null));
        return;
      }
      if (navState.view !== "admin") updateNav({ view: "admin" });
      return;
    }

    if (target.view === "board" && target.boardId) {
      const board = boards.find((b) => b.id === target.boardId);
      if (!board || !canAccessBoard(board, workspaces, currentUserId, isAdmin)) {
        router.replace(buildUrl("dashboard", null, null));
        return;
      }
      if (navState.view !== "board" || navState.activeBoardId !== target.boardId) {
        updateNav({ view: "board", activeBoardId: target.boardId, selectedCardId: null, selectedListId: null });
        return;
      }
      if (target.cardId && target.cardId !== navState.selectedCardId) {
        const listId = findCardListId(boards, target.boardId, target.cardId);
        if (listId) updateNav({ selectedCardId: target.cardId, selectedListId: listId });
        else router.replace(buildUrl("board", target.boardId, null));
      } else if (!target.cardId && navState.selectedCardId) {
        updateNav({ selectedCardId: null, selectedListId: null });
      }
      return;
    }

    if (navState.view !== "dashboard") {
      updateNav({ view: "dashboard", activeBoardId: null, selectedCardId: null, selectedListId: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- skipUrlSyncRef is a stable ref, intentionally excluded
  }, [
    pathname,
    searchParams,
    boards,
    workspaces,
    boardsLoading,
    workspacesLoading,
    currentUserId,
    isAdmin,
    navState.view,
    navState.activeBoardId,
    navState.selectedCardId,
    router,
    updateNav,
  ]);
}
