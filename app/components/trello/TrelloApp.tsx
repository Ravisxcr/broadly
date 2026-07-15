"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as api from "../../lib/trello/api";
import { AVATAR_COLORS, DEFAULT_ROSTER, getThemeColors } from "../../lib/trello/data";
import type { BoardData, CardData, Member, ThemeMode, ViewName, WorkspaceData } from "../../lib/trello/types";
import LoginView from "./LoginView";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import DashboardView from "./DashboardView";
import AdminView from "./AdminView";
import BoardView from "./BoardView";
import CreateBoardModal from "./CreateBoardModal";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import CardModal from "./CardModal";

interface AppState {
  view: ViewName;
  roster: Member[];
  currentUserId: string | null;
  activeBoardId: string | null;
  selectedCardId: string | null;
  selectedListId: string | null;
  sidebarOpen: boolean;
  isAddingList: boolean;
  newListTitle: string;
  editingListId: string | null;
  editingListTitle: string;
  addingCardListId: string | null;
  newCardTitle: string;
  dragOverListId: string | null;
  labelPickerOpen: boolean;
  memberPickerOpen: boolean;
  newComment: string;
  creatingBoard: boolean;
  newBoardName: string;
  newBoardTemplate: string;
  newBoardWorkspaceId: string;
  inviteName: string;
  inviteEmail: string;
  theme: ThemeMode;
  profileMenuOpen: boolean;
  boardMenuOpenId: string | null;
  boardInfoOpenId: string | null;
  editingBoardId: string | null;
  editingBoardNameValue: string;
  collapsedWorkspaceIds: string[];
  creatingWorkspace: boolean;
  newWorkspaceName: string;
  editingWorkspaceId: string | null;
  editingWorkspaceNameValue: string;
  workspaceMenuOpenId: string | null;
}

function initialState(): AppState {
  return {
    view: "login",
    roster: DEFAULT_ROSTER.map((m) => ({ ...m })),
    currentUserId: null,
    activeBoardId: null,
    selectedCardId: null,
    selectedListId: null,
    sidebarOpen: true,
    isAddingList: false,
    newListTitle: "",
    editingListId: null,
    editingListTitle: "",
    addingCardListId: null,
    newCardTitle: "",
    dragOverListId: null,
    labelPickerOpen: false,
    memberPickerOpen: false,
    newComment: "",
    creatingBoard: false,
    newBoardName: "",
    newBoardTemplate: "todo3",
    newBoardWorkspaceId: "",
    inviteName: "",
    inviteEmail: "",
    theme: "system",
    profileMenuOpen: false,
    boardMenuOpenId: null,
    boardInfoOpenId: null,
    editingBoardId: null,
    editingBoardNameValue: "",
    collapsedWorkspaceIds: [],
    creatingWorkspace: false,
    newWorkspaceName: "",
    editingWorkspaceId: null,
    editingWorkspaceNameValue: "",
    workspaceMenuOpenId: null,
  };
}

function findCard(boards: BoardData[], boardId: string, cardId: string): CardData | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  for (const list of board.lists) {
    const card = list.cards.find((c) => c.id === cardId);
    if (card) return card;
  }
  return null;
}

function replaceBoardInCache(queryClient: QueryClient, board: BoardData) {
  queryClient.setQueryData<BoardData[]>(["boards"], (old) => old?.map((b) => (b.id === board.id ? board : b)));
}

function patchCardInCache(queryClient: QueryClient, boardId: string, cardId: string, patch: Partial<Omit<CardData, "id">>) {
  queryClient.setQueryData<BoardData[]>(["boards"], (old) =>
    old?.map((b) =>
      b.id !== boardId
        ? b
        : { ...b, lists: b.lists.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id !== cardId ? c : { ...c, ...patch })) })) }
    )
  );
}

export default function TrelloApp() {
  const [state, setState] = useState<AppState>(initialState);
  const draggingCardId = useRef<string | null>(null);
  const draggingSourceListId = useRef<string | null>(null);
  const cardPatchTimers = useRef<Record<string, { boardId: string; patch: Partial<Omit<CardData, "id">>; timer: ReturnType<typeof setTimeout> }>>({});

  const queryClient = useQueryClient();
  const boardsQuery = useQuery({ queryKey: ["boards"], queryFn: api.fetchBoards, refetchInterval: 3000 });
  const workspacesQuery = useQuery({ queryKey: ["workspaces"], queryFn: api.fetchWorkspaces });

  function update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme = getThemeColors(state.theme === "system" ? systemPrefersDark : state.theme === "dark");

  // Mutations (declared unconditionally, ahead of the early returns below, per the
  // Rules of Hooks) — each syncs the ["boards"] query cache on success; the ones that
  // fire from high-frequency interactions (drag, card edits) also apply an
  // optimistic update in onMutate and roll back on error.
  const createBoardMutation = useMutation({
    mutationFn: api.createBoard,
    onSuccess: (board) => {
      queryClient.setQueryData<BoardData[]>(["boards"], (old) => [...(old ?? []), board]);
      update({ view: "board", activeBoardId: board.id });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: (vars: { boardId: string; patch: Partial<Pick<BoardData, "name" | "locked" | "memberIds">> }) => api.updateBoard(vars.boardId, vars.patch),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      queryClient.setQueryData<BoardData[]>(["boards"], (old) => old?.map((b) => (b.id !== vars.boardId ? b : { ...b, ...vars.patch })));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => api.deleteBoard(boardId),
    onMutate: async (boardId) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      queryClient.setQueryData<BoardData[]>(["boards"], (old) => old?.filter((b) => b.id !== boardId));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: api.createWorkspace,
    onSuccess: (workspace) => {
      queryClient.setQueryData<WorkspaceData[]>(["workspaces"], (old) => [...(old ?? []), workspace]);
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: (vars: { workspaceId: string; name: string }) => api.updateWorkspace(vars.workspaceId, { name: vars.name }),
    onSuccess: (workspace) => {
      queryClient.setQueryData<WorkspaceData[]>(["workspaces"], (old) => old?.map((w) => (w.id === workspace.id ? workspace : w)));
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (workspaceId: string) => api.deleteWorkspace(workspaceId),
    onSuccess: (_data, workspaceId) => {
      queryClient.setQueryData<WorkspaceData[]>(["workspaces"], (old) => old?.filter((w) => w.id !== workspaceId));
    },
  });

  const addListMutation = useMutation({
    mutationFn: (vars: { boardId: string; title: string }) => api.addList(vars.boardId, vars.title),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const renameListMutation = useMutation({
    mutationFn: (vars: { boardId: string; listId: string; title: string }) => api.renameList(vars.boardId, vars.listId, vars.title),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const deleteListMutation = useMutation({
    mutationFn: (vars: { boardId: string; listId: string }) => api.deleteList(vars.boardId, vars.listId),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const addCardMutation = useMutation({
    mutationFn: (vars: { boardId: string; listId: string; title: string }) => api.addCard(vars.boardId, vars.listId, vars.title),
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const updateCardMutation = useMutation({
    mutationFn: (vars: { boardId: string; cardId: string; patch: Partial<Omit<CardData, "id">> }) => api.updateCard(vars.boardId, vars.cardId, vars.patch),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      patchCardInCache(queryClient, vars.boardId, vars.cardId, vars.patch);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  const moveCardMutation = useMutation({
    mutationFn: (vars: { boardId: string; cardId: string; fromListId: string; toListId: string }) =>
      api.moveCard(vars.boardId, vars.cardId, vars.fromListId, vars.toListId),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["boards"] });
      const previous = queryClient.getQueryData<BoardData[]>(["boards"]);
      queryClient.setQueryData<BoardData[]>(["boards"], (old) =>
        old?.map((b) => {
          if (b.id !== vars.boardId) return b;
          let moved: CardData | null = null;
          const lists = b.lists.map((l) => {
            if (l.id !== vars.fromListId) return l;
            moved = l.cards.find((c) => c.id === vars.cardId) ?? null;
            return { ...l, cards: l.cards.filter((c) => c.id !== vars.cardId) };
          });
          if (!moved) return b;
          return { ...b, lists: lists.map((l) => (l.id === vars.toListId ? { ...l, cards: [...l.cards, moved as CardData] } : l)) };
        })
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["boards"], context.previous);
    },
    onSuccess: (board) => replaceBoardInCache(queryClient, board),
  });

  function scheduleCardPatch(boardId: string, cardId: string, patch: Partial<Omit<CardData, "id">>) {
    const existing = cardPatchTimers.current[cardId];
    const merged = { ...(existing?.patch ?? {}), ...patch };
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
      delete cardPatchTimers.current[cardId];
      updateCardMutation.mutate({ boardId, cardId, patch: merged });
    }, 500);
    cardPatchTimers.current[cardId] = { boardId, patch: merged, timer };
  }

  if (state.view === "login") {
    return (
      <LoginView
        onLoginAdmin={() => update({ view: "dashboard", currentUserId: "u1" })}
        onLoginMember={() => update({ view: "dashboard", currentUserId: "u2" })}
      />
    );
  }

  if (!boardsQuery.data || !workspacesQuery.data) {
    return (
      <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: theme.bgApp, color: theme.text }}>
        {boardsQuery.isError || workspacesQuery.isError ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Couldn&apos;t load boards. Is MongoDB running?</div>
            <button
              onClick={() => {
                boardsQuery.refetch();
                workspacesQuery.refetch();
              }}
              style={{ padding: "8px 16px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
            >
              Retry
            </button>
          </>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading boards…</div>
        )}
      </div>
    );
  }

  const boards = boardsQuery.data;
  const workspaces = workspacesQuery.data;

  const goToDashboard = () => update({ view: "dashboard", selectedCardId: null });
  const openBoard = (boardId: string) => update({ view: "board", activeBoardId: boardId });
  const goToAdmin = () => update({ view: "admin", profileMenuOpen: false });
  const toggleSidebar = () => update((s) => ({ sidebarOpen: !s.sidebarOpen }));

  const toggleProfileMenu = () => update((s) => ({ profileMenuOpen: !s.profileMenuOpen }));
  const closeProfileMenu = () => update({ profileMenuOpen: false });
  const setTheme = (theme: ThemeMode) => update({ theme });
  const logout = () => update({ view: "login", currentUserId: null, profileMenuOpen: false });

  const inviteMember = () => {
    const name = state.inviteName.trim();
    const email = state.inviteEmail.trim();
    if (!name) return;
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const color = AVATAR_COLORS[state.roster.length % AVATAR_COLORS.length];
    const newMember: Member = { id: "u" + Date.now(), initials, name, email: email || "—", color, role: "member" };
    update((s) => ({ roster: [...s.roster, newMember], inviteName: "", inviteEmail: "" }));
  };

  const removeMember = (userId: string) => {
    update((s) => ({ roster: s.roster.filter((m) => m.id !== userId) }));
    boards
      .filter((b) => b.memberIds.includes(userId))
      .forEach((b) => updateBoardMutation.mutate({ boardId: b.id, patch: { memberIds: b.memberIds.filter((id) => id !== userId) } }));
  };

  const toggleBoardAccess = (boardId: string, userId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    const memberIds = board.memberIds.includes(userId) ? board.memberIds.filter((id) => id !== userId) : [...board.memberIds, userId];
    updateBoardMutation.mutate({ boardId, patch: { memberIds } });
  };

  const openCreateBoard = (workspaceId?: string) =>
    update({ creatingBoard: true, newBoardName: "", newBoardTemplate: "todo3", newBoardWorkspaceId: workspaceId ?? workspaces[0]?.id ?? "" });
  const cancelCreateBoard = () => update({ creatingBoard: false });

  const toggleBoardMenu = (boardId: string) => update((s) => ({ boardMenuOpenId: s.boardMenuOpenId === boardId ? null : boardId }));
  const closeBoardMenu = () => update({ boardMenuOpenId: null });

  const openBoardInfo = (boardId: string) => update({ boardInfoOpenId: boardId, boardMenuOpenId: null });
  const closeBoardInfo = () => update({ boardInfoOpenId: null });

  const startEditBoardName = (boardId: string, currentName: string) => update({ editingBoardId: boardId, editingBoardNameValue: currentName, boardMenuOpenId: null });
  const cancelEditBoardName = () => update({ editingBoardId: null, editingBoardNameValue: "" });
  const confirmEditBoardName = () => {
    const boardId = state.editingBoardId;
    const name = state.editingBoardNameValue.trim();
    update({ editingBoardId: null, editingBoardNameValue: "" });
    if (!boardId || !name) return;
    updateBoardMutation.mutate({ boardId, patch: { name } });
  };

  const toggleLockBoard = (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    update({ boardMenuOpenId: null });
    if (!board) return;
    updateBoardMutation.mutate({ boardId, patch: { locked: !board.locked } });
  };

  const deleteBoard = (boardId: string) => {
    if (!window.confirm("Delete this board? This can't be undone.")) return;
    update((s) => ({
      activeBoardId: s.activeBoardId === boardId ? null : s.activeBoardId,
      view: s.activeBoardId === boardId && s.view === "board" ? "dashboard" : s.view,
      boardMenuOpenId: null,
    }));
    deleteBoardMutation.mutate(boardId);
  };

  const createBoard = () => {
    const name = state.newBoardName.trim() || "New Board";
    const templateId = state.newBoardTemplate;
    const memberIds = state.currentUserId ? [state.currentUserId] : [];
    const workspaceId = state.newBoardWorkspaceId || workspaces[0]?.id || "";
    update({ creatingBoard: false });
    createBoardMutation.mutate({ name, templateId, memberIds, workspaceId });
  };

  const toggleWorkspaceCollapse = (workspaceId: string) =>
    update((s) => ({
      collapsedWorkspaceIds: s.collapsedWorkspaceIds.includes(workspaceId)
        ? s.collapsedWorkspaceIds.filter((id) => id !== workspaceId)
        : [...s.collapsedWorkspaceIds, workspaceId],
    }));

  const openCreateWorkspace = () => update({ creatingWorkspace: true, newWorkspaceName: "" });
  const cancelCreateWorkspace = () => update({ creatingWorkspace: false });
  const confirmCreateWorkspace = () => {
    const name = state.newWorkspaceName.trim();
    update({ creatingWorkspace: false });
    if (!name) return;
    createWorkspaceMutation.mutate({ name });
  };

  const toggleWorkspaceMenu = (workspaceId: string) => update((s) => ({ workspaceMenuOpenId: s.workspaceMenuOpenId === workspaceId ? null : workspaceId }));
  const closeWorkspaceMenu = () => update({ workspaceMenuOpenId: null });

  const startEditWorkspaceName = (workspaceId: string, currentName: string) =>
    update({ editingWorkspaceId: workspaceId, editingWorkspaceNameValue: currentName, workspaceMenuOpenId: null });
  const cancelEditWorkspaceName = () => update({ editingWorkspaceId: null, editingWorkspaceNameValue: "" });
  const confirmEditWorkspaceName = () => {
    const workspaceId = state.editingWorkspaceId;
    const name = state.editingWorkspaceNameValue.trim();
    update({ editingWorkspaceId: null, editingWorkspaceNameValue: "" });
    if (!workspaceId || !name) return;
    updateWorkspaceMutation.mutate({ workspaceId, name });
  };

  const deleteWorkspace = (workspaceId: string) => {
    update({ workspaceMenuOpenId: null });
    if (boards.some((b) => b.workspaceId === workspaceId)) {
      window.alert("Move or delete its boards first.");
      return;
    }
    if (!window.confirm("Delete this workspace? This can't be undone.")) return;
    deleteWorkspaceMutation.mutate(workspaceId);
  };

  const openCard = (cardId: string, listId: string) => update({ selectedCardId: cardId, selectedListId: listId, labelPickerOpen: false, memberPickerOpen: false });
  const closeModal = () => update({ selectedCardId: null, labelPickerOpen: false, memberPickerOpen: false });

  const openAddList = () => update({ isAddingList: true, newListTitle: "" });
  const cancelAddList = () => update({ isAddingList: false, newListTitle: "" });
  const confirmAddList = () => {
    const title = state.newListTitle.trim();
    const boardId = state.activeBoardId;
    update({ isAddingList: false, newListTitle: "" });
    if (!title || !boardId) return;
    addListMutation.mutate({ boardId, title });
  };

  const startEditListTitle = (listId: string, currentTitle: string) => update({ editingListId: listId, editingListTitle: currentTitle });
  const cancelEditListTitle = () => update({ editingListId: null, editingListTitle: "" });
  const confirmEditListTitle = () => {
    const listId = state.editingListId;
    const boardId = state.activeBoardId;
    const title = state.editingListTitle.trim();
    update({ editingListId: null, editingListTitle: "" });
    if (!listId || !boardId || !title) return;
    renameListMutation.mutate({ boardId, listId, title });
  };

  const deleteList = (listId: string) => {
    const boardId = state.activeBoardId;
    update((s) => ({
      addingCardListId: s.addingCardListId === listId ? null : s.addingCardListId,
      editingListId: s.editingListId === listId ? null : s.editingListId,
      selectedCardId: s.selectedListId === listId ? null : s.selectedCardId,
      selectedListId: s.selectedListId === listId ? null : s.selectedListId,
    }));
    if (!boardId) return;
    deleteListMutation.mutate({ boardId, listId });
  };

  const openAddCard = (listId: string) => update({ addingCardListId: listId, newCardTitle: "" });
  const cancelAddCard = () => update({ addingCardListId: null, newCardTitle: "" });
  const confirmAddCard = (listId: string) => {
    const title = state.newCardTitle.trim();
    const boardId = state.activeBoardId;
    update({ addingCardListId: null, newCardTitle: "" });
    if (!title || !boardId) return;
    addCardMutation.mutate({ boardId, listId, title });
  };

  const onDragStartCard = (cardId: string, listId: string) => {
    draggingCardId.current = cardId;
    draggingSourceListId.current = listId;
  };
  const onDragOverList = (listId: string, e: DragEvent) => {
    e.preventDefault();
    if (state.dragOverListId !== listId) update({ dragOverListId: listId });
  };
  const onDragLeaveList = () => update({ dragOverListId: null });
  const onDropList = (listId: string, e: DragEvent) => {
    e.preventDefault();
    const cardId = draggingCardId.current;
    const sourceListId = draggingSourceListId.current;
    const boardId = state.activeBoardId;
    update({ dragOverListId: null });
    draggingCardId.current = null;
    draggingSourceListId.current = null;
    if (!cardId || !sourceListId || !boardId || sourceListId === listId) return;
    moveCardMutation.mutate({ boardId, cardId, fromListId: sourceListId, toListId: listId });
  };

  const toggleLabelPicker = () => update((s) => ({ labelPickerOpen: !s.labelPickerOpen, memberPickerOpen: false }));
  const toggleMemberPicker = () => update((s) => ({ memberPickerOpen: !s.memberPickerOpen, labelPickerOpen: false }));

  const toggleLabelOnCard = (labelId: string) => {
    const boardId = state.activeBoardId;
    const cardId = state.selectedCardId;
    if (!boardId || !cardId) return;
    const card = findCard(boards, boardId, cardId);
    if (!card) return;
    const labelIds = card.labelIds.includes(labelId) ? card.labelIds.filter((id) => id !== labelId) : [...card.labelIds, labelId];
    updateCardMutation.mutate({ boardId, cardId, patch: { labelIds } });
  };

  const toggleMemberOnCard = (memberId: string) => {
    const boardId = state.activeBoardId;
    const cardId = state.selectedCardId;
    if (!boardId || !cardId) return;
    const card = findCard(boards, boardId, cardId);
    if (!card) return;
    const memberIds = card.memberIds.includes(memberId) ? card.memberIds.filter((id) => id !== memberId) : [...card.memberIds, memberId];
    updateCardMutation.mutate({ boardId, cardId, patch: { memberIds } });
  };

  const toggleChecklistItem = (idx: number) => {
    const boardId = state.activeBoardId;
    const cardId = state.selectedCardId;
    if (!boardId || !cardId) return;
    const card = findCard(boards, boardId, cardId);
    if (!card) return;
    const checklist = card.checklist.map((item, i) => (i !== idx ? item : { ...item, done: !item.done }));
    updateCardMutation.mutate({ boardId, cardId, patch: { checklist } });
  };

  const onCardTitleChange = (value: string) => {
    const boardId = state.activeBoardId;
    const cardId = state.selectedCardId;
    if (!boardId || !cardId) return;
    patchCardInCache(queryClient, boardId, cardId, { title: value });
    scheduleCardPatch(boardId, cardId, { title: value });
  };

  const onCardDescChange = (value: string) => {
    const boardId = state.activeBoardId;
    const cardId = state.selectedCardId;
    if (!boardId || !cardId) return;
    patchCardInCache(queryClient, boardId, cardId, { desc: value });
    scheduleCardPatch(boardId, cardId, { desc: value });
  };

  const addComment = () => {
    const text = state.newComment.trim();
    const boardId = state.activeBoardId;
    const cardId = state.selectedCardId;
    if (!text || !boardId || !cardId) return;
    const card = findCard(boards, boardId, cardId);
    if (!card) return;
    const comments = [...card.comments, { author: currentUser?.name ?? "Someone", initials: currentUser?.initials ?? "??", color: currentUser?.color ?? "#4F46E5", time: "just now", text }];
    update({ newComment: "" });
    updateCardMutation.mutate({ boardId, cardId, patch: { comments } });
  };

  // Derived state
  const activeBoardRaw = boards.find((b) => b.id === state.activeBoardId) ?? null;
  const currentUser = state.roster.find((m) => m.id === state.currentUserId);
  const isAdmin = !!currentUser && currentUser.role === "admin";
  const visibleBoards = isAdmin ? boards : boards.filter((b) => state.currentUserId !== null && b.memberIds.includes(state.currentUserId));

  let selectedCard: CardData | null = null;
  let selectedListTitle = "";
  if (state.selectedCardId && activeBoardRaw) {
    for (const list of activeBoardRaw.lists) {
      const found = list.cards.find((c) => c.id === state.selectedCardId);
      if (found) {
        selectedCard = found;
        selectedListTitle = list.title;
        break;
      }
    }
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: theme.bgApp, color: theme.text, overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", width: "100%", height: "100vh" }}>
        <Sidebar
          theme={theme}
          sidebarOpen={state.sidebarOpen}
          onToggleSidebar={toggleSidebar}
          boards={visibleBoards}
          workspaces={workspaces}
          activeBoardId={state.activeBoardId}
          view={state.view}
          isAdmin={isAdmin}
          onGoToDashboard={goToDashboard}
          onGoToAdmin={goToAdmin}
          onOpenBoard={openBoard}
          onOpenCreateBoard={openCreateBoard}
          collapsedWorkspaceIds={state.collapsedWorkspaceIds}
          onToggleWorkspaceCollapse={toggleWorkspaceCollapse}
          onOpenCreateWorkspace={openCreateWorkspace}
          workspaceMenuOpenId={state.workspaceMenuOpenId}
          onToggleWorkspaceMenu={toggleWorkspaceMenu}
          onCloseWorkspaceMenu={closeWorkspaceMenu}
          editingWorkspaceId={state.editingWorkspaceId}
          editingWorkspaceNameValue={state.editingWorkspaceNameValue}
          onStartEditWorkspaceName={startEditWorkspaceName}
          onEditingWorkspaceNameChange={(value) => update({ editingWorkspaceNameValue: value })}
          onConfirmEditWorkspaceName={confirmEditWorkspaceName}
          onCancelEditWorkspaceName={cancelEditWorkspaceName}
          onDeleteWorkspace={deleteWorkspace}
        />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopNav
            theme={theme}
            themeMode={state.theme}
            view={state.view}
            activeBoard={activeBoardRaw}
            isAdmin={isAdmin}
            currentUser={currentUser}
            profileMenuOpen={state.profileMenuOpen}
            onToggleProfileMenu={toggleProfileMenu}
            onCloseProfileMenu={closeProfileMenu}
            onGoToDashboard={goToDashboard}
            onGoToAdmin={goToAdmin}
            onLogout={logout}
            onSetLightTheme={() => setTheme("light")}
            onSetDarkTheme={() => setTheme("dark")}
            onSetSystemTheme={() => setTheme("system")}
            boardMenuOpen={!!activeBoardRaw && state.boardMenuOpenId === activeBoardRaw.id}
            onToggleBoardMenu={() => activeBoardRaw && toggleBoardMenu(activeBoardRaw.id)}
            onCloseBoardMenu={closeBoardMenu}
            editingBoardName={!!activeBoardRaw && state.editingBoardId === activeBoardRaw.id}
            editingBoardNameValue={state.editingBoardNameValue}
            onStartEditBoardName={() => activeBoardRaw && startEditBoardName(activeBoardRaw.id, activeBoardRaw.name)}
            onEditingBoardNameChange={(value) => update({ editingBoardNameValue: value })}
            onConfirmEditBoardName={confirmEditBoardName}
            onCancelEditBoardName={cancelEditBoardName}
            onToggleLockBoard={() => activeBoardRaw && toggleLockBoard(activeBoardRaw.id)}
            onDeleteBoard={() => activeBoardRaw && deleteBoard(activeBoardRaw.id)}
          />

          {state.view === "dashboard" && (
            <DashboardView
              theme={theme}
              boards={visibleBoards}
              workspaces={workspaces}
              roster={state.roster}
              isAdmin={isAdmin}
              onOpenBoard={openBoard}
              onOpenCreateBoard={openCreateBoard}
              boardMenuOpenId={state.boardMenuOpenId}
              onToggleBoardMenu={toggleBoardMenu}
              onCloseBoardMenu={closeBoardMenu}
              boardInfoOpenId={state.boardInfoOpenId}
              onOpenBoardInfo={openBoardInfo}
              onCloseBoardInfo={closeBoardInfo}
              editingBoardId={state.editingBoardId}
              editingBoardNameValue={state.editingBoardNameValue}
              onStartEditBoardName={startEditBoardName}
              onEditingBoardNameChange={(value) => update({ editingBoardNameValue: value })}
              onConfirmEditBoardName={confirmEditBoardName}
              onCancelEditBoardName={cancelEditBoardName}
              onToggleLockBoard={toggleLockBoard}
              onDeleteBoard={deleteBoard}
              onOpenCreateWorkspace={openCreateWorkspace}
              workspaceMenuOpenId={state.workspaceMenuOpenId}
              onToggleWorkspaceMenu={toggleWorkspaceMenu}
              onCloseWorkspaceMenu={closeWorkspaceMenu}
              editingWorkspaceId={state.editingWorkspaceId}
              editingWorkspaceNameValue={state.editingWorkspaceNameValue}
              onStartEditWorkspaceName={startEditWorkspaceName}
              onEditingWorkspaceNameChange={(value) => update({ editingWorkspaceNameValue: value })}
              onConfirmEditWorkspaceName={confirmEditWorkspaceName}
              onCancelEditWorkspaceName={cancelEditWorkspaceName}
              onDeleteWorkspace={deleteWorkspace}
            />
          )}

          {state.view === "admin" && (
            <AdminView
              theme={theme}
              roster={state.roster}
              boards={boards}
              inviteName={state.inviteName}
              inviteEmail={state.inviteEmail}
              onInviteNameChange={(value) => update({ inviteName: value })}
              onInviteEmailChange={(value) => update({ inviteEmail: value })}
              onInviteMember={inviteMember}
              onRemoveMember={removeMember}
              onToggleBoardAccess={toggleBoardAccess}
            />
          )}

          {state.view === "board" && activeBoardRaw && (
            <BoardView
              theme={theme}
              board={activeBoardRaw}
              roster={state.roster}
              dragOverListId={state.dragOverListId}
              onDragStartCard={onDragStartCard}
              onDragOverList={onDragOverList}
              onDragLeaveList={onDragLeaveList}
              onDropList={onDropList}
              onOpenCard={openCard}
              editingListId={state.editingListId}
              editingListTitle={state.editingListTitle}
              onStartEditListTitle={startEditListTitle}
              onCancelEditListTitle={cancelEditListTitle}
              onEditingListTitleChange={(value) => update({ editingListTitle: value })}
              onConfirmEditListTitle={confirmEditListTitle}
              onDeleteList={deleteList}
              addingCardListId={state.addingCardListId}
              newCardTitle={state.newCardTitle}
              onOpenAddCard={openAddCard}
              onCancelAddCard={cancelAddCard}
              onNewCardTitleChange={(value) => update({ newCardTitle: value })}
              onConfirmAddCard={confirmAddCard}
              isAddingList={state.isAddingList}
              newListTitle={state.newListTitle}
              onOpenAddList={openAddList}
              onCancelAddList={cancelAddList}
              onNewListTitleChange={(value) => update({ newListTitle: value })}
              onConfirmAddList={confirmAddList}
            />
          )}
        </div>
      </div>

      {state.creatingBoard && (
        <CreateBoardModal
          theme={theme}
          newBoardName={state.newBoardName}
          onNameChange={(value) => update({ newBoardName: value })}
          selectedTemplateId={state.newBoardTemplate}
          onSelectTemplate={(templateId) => update({ newBoardTemplate: templateId })}
          workspaces={workspaces}
          selectedWorkspaceId={state.newBoardWorkspaceId}
          onSelectWorkspace={(workspaceId) => update({ newBoardWorkspaceId: workspaceId })}
          onCancel={cancelCreateBoard}
          onCreate={createBoard}
        />
      )}

      {state.creatingWorkspace && (
        <CreateWorkspaceModal
          theme={theme}
          newWorkspaceName={state.newWorkspaceName}
          onNameChange={(value) => update({ newWorkspaceName: value })}
          onCancel={cancelCreateWorkspace}
          onCreate={confirmCreateWorkspace}
        />
      )}

      {selectedCard && (
        <CardModal
          theme={theme}
          card={selectedCard}
          listTitle={selectedListTitle}
          roster={state.roster}
          locked={!!activeBoardRaw?.locked}
          labelPickerOpen={state.labelPickerOpen}
          memberPickerOpen={state.memberPickerOpen}
          onClose={closeModal}
          onTitleChange={onCardTitleChange}
          onDescChange={onCardDescChange}
          onToggleLabelPicker={toggleLabelPicker}
          onToggleMemberPicker={toggleMemberPicker}
          onToggleLabel={toggleLabelOnCard}
          onToggleMember={toggleMemberOnCard}
          onToggleChecklistItem={toggleChecklistItem}
          newComment={state.newComment}
          onNewCommentChange={(value) => update({ newComment: value })}
          onAddComment={addComment}
        />
      )}
    </div>
  );
}
