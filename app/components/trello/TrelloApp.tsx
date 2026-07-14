"use client";

import { useRef, useState, type DragEvent } from "react";
import { AVATAR_COLORS, BOARD_COVERS, COLUMN_TEMPLATES, DEFAULT_ROSTER, getThemeColors, initialBoards } from "../../lib/trello/data";
import type { BoardData, CardData, Member, ThemeMode, ViewName } from "../../lib/trello/types";
import LoginView from "./LoginView";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import DashboardView from "./DashboardView";
import AdminView from "./AdminView";
import BoardView from "./BoardView";
import CreateBoardModal from "./CreateBoardModal";
import CardModal from "./CardModal";

interface AppState {
  view: ViewName;
  boards: BoardData[];
  roster: Member[];
  currentUserId: string | null;
  activeBoardId: string | null;
  selectedCardId: string | null;
  selectedListId: string | null;
  sidebarOpen: boolean;
  isAddingList: boolean;
  newListTitle: string;
  addingCardListId: string | null;
  newCardTitle: string;
  dragOverListId: string | null;
  labelPickerOpen: boolean;
  memberPickerOpen: boolean;
  newComment: string;
  creatingBoard: boolean;
  newBoardName: string;
  newBoardTemplate: string;
  inviteName: string;
  inviteEmail: string;
  theme: ThemeMode;
  profileMenuOpen: boolean;
}

function initialState(): AppState {
  return {
    view: "login",
    boards: initialBoards(),
    roster: DEFAULT_ROSTER.map((m) => ({ ...m })),
    currentUserId: null,
    activeBoardId: null,
    selectedCardId: null,
    selectedListId: null,
    sidebarOpen: true,
    isAddingList: false,
    newListTitle: "",
    addingCardListId: null,
    newCardTitle: "",
    dragOverListId: null,
    labelPickerOpen: false,
    memberPickerOpen: false,
    newComment: "",
    creatingBoard: false,
    newBoardName: "",
    newBoardTemplate: "todo3",
    inviteName: "",
    inviteEmail: "",
    theme: "light",
    profileMenuOpen: false,
  };
}

function makeCard(id: string, title: string): CardData {
  return { id, title, labelIds: [], memberIds: [], due: null, desc: "", checklist: [], comments: [] };
}

export default function TrelloApp() {
  const [state, setState] = useState<AppState>(initialState);
  const draggingCardId = useRef<string | null>(null);
  const draggingSourceListId = useRef<string | null>(null);

  function update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }

  const doLogin = (userId: string) => update({ view: "dashboard", currentUserId: userId });
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
    update((s) => ({
      roster: s.roster.filter((m) => m.id !== userId),
      boards: s.boards.map((b) => ({ ...b, memberIds: b.memberIds.filter((id) => id !== userId) })),
    }));
  };

  const toggleBoardAccess = (boardId: string, userId: string) => {
    update((s) => ({
      boards: s.boards.map((b) =>
        b.id !== boardId ? b : { ...b, memberIds: b.memberIds.includes(userId) ? b.memberIds.filter((id) => id !== userId) : [...b.memberIds, userId] }
      ),
    }));
  };

  const openCreateBoard = () => update({ creatingBoard: true, newBoardName: "", newBoardTemplate: "todo3" });
  const cancelCreateBoard = () => update({ creatingBoard: false });

  const createBoard = () => {
    const idx = state.boards.length;
    const template = COLUMN_TEMPLATES.find((t) => t.id === state.newBoardTemplate) || COLUMN_TEMPLATES[0];
    const name = state.newBoardName.trim() || "New Board";
    const newBoard: BoardData = {
      id: "b" + Date.now(),
      name,
      cover: BOARD_COVERS[idx % BOARD_COVERS.length],
      memberIds: state.currentUserId ? [state.currentUserId] : [],
      lists: template.lists.map((title, i) => ({ id: "l" + i, title, cards: [] })),
    };
    update((s) => ({ boards: [...s.boards, newBoard], view: "board", activeBoardId: newBoard.id, creatingBoard: false }));
  };

  const openCard = (cardId: string, listId: string) => update({ selectedCardId: cardId, selectedListId: listId, labelPickerOpen: false, memberPickerOpen: false });
  const closeModal = () => update({ selectedCardId: null, labelPickerOpen: false, memberPickerOpen: false });

  const openAddList = () => update({ isAddingList: true, newListTitle: "" });
  const cancelAddList = () => update({ isAddingList: false, newListTitle: "" });
  const confirmAddList = () => {
    const title = state.newListTitle.trim();
    if (!title) {
      cancelAddList();
      return;
    }
    update((s) => ({
      boards: s.boards.map((b) => (b.id !== s.activeBoardId ? b : { ...b, lists: [...b.lists, { id: "l" + Date.now(), title, cards: [] }] })),
      isAddingList: false,
      newListTitle: "",
    }));
  };

  const openAddCard = (listId: string) => update({ addingCardListId: listId, newCardTitle: "" });
  const cancelAddCard = () => update({ addingCardListId: null, newCardTitle: "" });
  const confirmAddCard = (listId: string) => {
    const title = state.newCardTitle.trim();
    if (!title) {
      cancelAddCard();
      return;
    }
    update((s) => ({
      boards: s.boards.map((b) =>
        b.id !== s.activeBoardId ? b : { ...b, lists: b.lists.map((l) => (l.id !== listId ? l : { ...l, cards: [...l.cards, makeCard("c" + Date.now(), title)] })) }
      ),
      addingCardListId: null,
      newCardTitle: "",
    }));
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
    if (!cardId || sourceListId === listId) {
      update({ dragOverListId: null });
      return;
    }
    update((s) => {
      const boards = s.boards.map((b) => {
        if (b.id !== s.activeBoardId) return b;
        let moved: CardData | null = null;
        const lists = b.lists.map((l) => {
          if (l.id === sourceListId) {
            moved = l.cards.find((c) => c.id === cardId) ?? null;
            return { ...l, cards: l.cards.filter((c) => c.id !== cardId) };
          }
          return l;
        });
        return { ...b, lists: lists.map((l) => (l.id === listId && moved ? { ...l, cards: [...l.cards, moved] } : l)) };
      });
      return { boards, dragOverListId: null };
    });
    draggingCardId.current = null;
    draggingSourceListId.current = null;
  };

  const toggleLabelPicker = () => update((s) => ({ labelPickerOpen: !s.labelPickerOpen, memberPickerOpen: false }));
  const toggleMemberPicker = () => update((s) => ({ memberPickerOpen: !s.memberPickerOpen, labelPickerOpen: false }));

  const toggleLabelOnCard = (labelId: string) => {
    update((s) => ({
      boards: s.boards.map((b) =>
        b.id !== s.activeBoardId
          ? b
          : {
              ...b,
              lists: b.lists.map((l) => ({
                ...l,
                cards: l.cards.map((c) =>
                  c.id !== s.selectedCardId ? c : { ...c, labelIds: c.labelIds.includes(labelId) ? c.labelIds.filter((id) => id !== labelId) : [...c.labelIds, labelId] }
                ),
              })),
            }
      ),
    }));
  };

  const toggleMemberOnCard = (memberId: string) => {
    update((s) => ({
      boards: s.boards.map((b) =>
        b.id !== s.activeBoardId
          ? b
          : {
              ...b,
              lists: b.lists.map((l) => ({
                ...l,
                cards: l.cards.map((c) =>
                  c.id !== s.selectedCardId ? c : { ...c, memberIds: c.memberIds.includes(memberId) ? c.memberIds.filter((id) => id !== memberId) : [...c.memberIds, memberId] }
                ),
              })),
            }
      ),
    }));
  };

  const toggleChecklistItem = (idx: number) => {
    update((s) => ({
      boards: s.boards.map((b) =>
        b.id !== s.activeBoardId
          ? b
          : {
              ...b,
              lists: b.lists.map((l) => ({
                ...l,
                cards: l.cards.map((c) => (c.id !== s.selectedCardId ? c : { ...c, checklist: c.checklist.map((item, i) => (i !== idx ? item : { ...item, done: !item.done })) })),
              })),
            }
      ),
    }));
  };

  const onCardTitleChange = (value: string) => {
    update((s) => ({
      boards: s.boards.map((b) => (b.id !== s.activeBoardId ? b : { ...b, lists: b.lists.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id !== s.selectedCardId ? c : { ...c, title: value })) })) })),
    }));
  };

  const onCardDescChange = (value: string) => {
    update((s) => ({
      boards: s.boards.map((b) => (b.id !== s.activeBoardId ? b : { ...b, lists: b.lists.map((l) => ({ ...l, cards: l.cards.map((c) => (c.id !== s.selectedCardId ? c : { ...c, desc: value })) })) })),
    }));
  };

  const addComment = () => {
    const text = state.newComment.trim();
    if (!text) return;
    update((s) => ({
      boards: s.boards.map((b) =>
        b.id !== s.activeBoardId
          ? b
          : {
              ...b,
              lists: b.lists.map((l) => ({
                ...l,
                cards: l.cards.map((c) => (c.id !== s.selectedCardId ? c : { ...c, comments: [...c.comments, { author: "Ari", initials: "AR", color: "#4F46E5", time: "just now", text }] })),
              })),
            }
      ),
      newComment: "",
    }));
  };

  // Derived state
  const activeBoardRaw = state.boards.find((b) => b.id === state.activeBoardId) ?? null;
  const currentUser = state.roster.find((m) => m.id === state.currentUserId);
  const isAdmin = !!currentUser && currentUser.role === "admin";
  const visibleBoards = isAdmin ? state.boards : state.boards.filter((b) => state.currentUserId !== null && b.memberIds.includes(state.currentUserId));
  const theme = getThemeColors(state.theme === "dark");

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

  if (state.view === "login") {
    return <LoginView onLoginAdmin={() => doLogin("u1")} onLoginMember={() => doLogin("u2")} />;
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: theme.bgApp, color: theme.text, overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", width: "100%", height: "100vh" }}>
        <Sidebar
          theme={theme}
          sidebarOpen={state.sidebarOpen}
          onToggleSidebar={toggleSidebar}
          boards={visibleBoards}
          activeBoardId={state.activeBoardId}
          view={state.view}
          isAdmin={isAdmin}
          onGoToDashboard={goToDashboard}
          onGoToAdmin={goToAdmin}
          onOpenBoard={openBoard}
          onOpenCreateBoard={openCreateBoard}
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
          />

          {state.view === "dashboard" && <DashboardView theme={theme} boards={visibleBoards} onOpenBoard={openBoard} onOpenCreateBoard={openCreateBoard} />}

          {state.view === "admin" && (
            <AdminView
              theme={theme}
              roster={state.roster}
              boards={state.boards}
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
          onCancel={cancelCreateBoard}
          onCreate={createBoard}
        />
      )}

      {selectedCard && (
        <CardModal
          theme={theme}
          card={selectedCard}
          listTitle={selectedListTitle}
          roster={state.roster}
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
