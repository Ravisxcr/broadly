"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildUrl } from "../url";
import { useUrlSync, type NavState } from "../hooks/useUrlSync";
import { useAuth } from "./AuthContext";
import { useBoards } from "./BoardsContext";
import { useWorkspaces } from "./WorkspacesContext";

interface NavigationContextValue {
  view: NavState["view"];
  activeBoardId: string | null;
  selectedCardId: string | null;
  selectedListId: string | null;
  goToDashboard(): void;
  goToAdmin(): void;
  openBoard(boardId: string): void;
  openCard(cardId: string, listId: string): void;
  closeCard(): void;
  resetToRoot(): void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navState, setNavState] = useState<NavState>({ view: "dashboard", activeBoardId: null, selectedCardId: null, selectedListId: null });
  const skipUrlSyncRef = useRef(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { currentUserId, roster } = useAuth();
  const { boards, isLoading: boardsLoading } = useBoards();
  const { workspaces, isLoading: workspacesLoading } = useWorkspaces();

  const updateNav = useCallback((patch: Partial<NavState>) => setNavState((s) => ({ ...s, ...patch })), []);

  // Handlers pair a state update with this so the URL mirrors the click immediately;
  // useUrlSync skips the run it provokes and only reconciles state from the URL for
  // navigations it didn't cause itself (back/forward, direct links, initial load).
  const navigate = useCallback(
    (url: string, replace = false) => {
      skipUrlSyncRef.current = true;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [router]
  );

  useUrlSync({
    pathname,
    searchParams,
    router,
    skipUrlSyncRef,
    currentUserId,
    roster,
    boards,
    workspaces,
    boardsLoading,
    workspacesLoading,
    navState,
    updateNav,
  });

  const goToDashboard = useCallback(() => {
    updateNav({ view: "dashboard", selectedCardId: null });
    navigate(buildUrl("dashboard", null, null));
  }, [updateNav, navigate]);

  const goToAdmin = useCallback(() => {
    updateNav({ view: "admin" });
    navigate(buildUrl("admin", null, null));
  }, [updateNav, navigate]);

  const openBoard = useCallback(
    (boardId: string) => {
      updateNav({ view: "board", activeBoardId: boardId, selectedCardId: null });
      navigate(buildUrl("board", boardId, null));
    },
    [updateNav, navigate]
  );

  const openCard = useCallback(
    (cardId: string, listId: string) => {
      updateNav({ selectedCardId: cardId, selectedListId: listId });
      if (navState.activeBoardId) navigate(buildUrl("board", navState.activeBoardId, cardId));
    },
    [updateNav, navigate, navState.activeBoardId]
  );

  const closeCard = useCallback(() => {
    updateNav({ selectedCardId: null });
    if (navState.activeBoardId) navigate(buildUrl("board", navState.activeBoardId, null), true);
  }, [updateNav, navigate, navState.activeBoardId]);

  const resetToRoot = useCallback(() => navigate("/", true), [navigate]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      view: navState.view,
      activeBoardId: navState.activeBoardId,
      selectedCardId: navState.selectedCardId,
      selectedListId: navState.selectedListId,
      goToDashboard,
      goToAdmin,
      openBoard,
      openCard,
      closeCard,
      resetToRoot,
    }),
    [navState, goToDashboard, goToAdmin, openBoard, openCard, closeCard, resetToRoot]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within a NavigationProvider");
  return ctx;
}
