"use client";

import { useRef, useState, type DragEvent } from "react";
import { Lock, Plus } from "lucide-react";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";
import ListColumn from "./ListColumn";

export default function BoardView() {
  const { theme } = useTheme();
  const { boards, addList, moveCard } = useBoards();
  const { activeBoardId } = useNavigation();

  const board = boards.find((b) => b.id === activeBoardId) ?? null;

  const draggingCardId = useRef<string | null>(null);
  const draggingSourceListId = useRef<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  if (!board) return null;
  const locked = !!board.locked;

  const handleDragStartCard = (cardId: string, listId: string) => {
    draggingCardId.current = cardId;
    draggingSourceListId.current = listId;
  };
  const handleDragOverList = (listId: string, e: DragEvent) => {
    e.preventDefault();
    if (dragOverListId !== listId) setDragOverListId(listId);
  };
  const handleDragLeaveList = () => setDragOverListId(null);
  const handleDropList = (listId: string, e: DragEvent) => {
    e.preventDefault();
    const cardId = draggingCardId.current;
    const sourceListId = draggingSourceListId.current;
    setDragOverListId(null);
    draggingCardId.current = null;
    draggingSourceListId.current = null;
    if (!cardId || !sourceListId || sourceListId === listId) return;
    moveCard(board.id, cardId, sourceListId, listId);
  };

  const openAddList = () => {
    setNewListTitle("");
    setIsAddingList(true);
  };
  const cancelAddList = () => setIsAddingList(false);
  const confirmAddList = () => {
    const title = newListTitle.trim();
    setIsAddingList(false);
    if (!title) return;
    addList(board.id, title);
  };

  return (
    <div style={{ flex: 1, overflowY: "hidden", display: "flex", flexDirection: "column", background: theme.bgApp }}>
      {locked && (
        <div style={{ padding: "8px 20px", fontSize: 12.5, fontWeight: 700, color: theme.warningText, background: theme.warningBg, borderBottom: `1px solid ${theme.warningBorder}`, display: "flex", alignItems: "center", gap: 6 }}>
          <Lock size={13} /> This board is locked — editing is disabled.
        </div>
      )}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        {board.lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            locked={locked}
            isDragOver={dragOverListId === list.id}
            onDragOverList={(e) => handleDragOverList(list.id, e)}
            onDragLeaveList={handleDragLeaveList}
            onDropList={(e) => handleDropList(list.id, e)}
            onDragStartCard={(cardId) => handleDragStartCard(cardId, list.id)}
          />
        ))}

        {!locked &&
          (isAddingList ? (
            <div style={{ width: 264, flexShrink: 0, background: theme.panelBg, borderRadius: 10, padding: 10, border: `1.5px solid ${theme.border}` }}>
              <input
                autoFocus
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="List name…"
                style={{ width: "100%", padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={confirmAddList}
                  style={{ padding: "7px 14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  Add list
                </button>
                <button
                  onClick={cancelAddList}
                  style={{ padding: "7px 10px", background: "transparent", color: theme.textSecondary, border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={openAddList}
              style={{ width: 220, flexShrink: 0, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: theme.textSecondary, cursor: "pointer", borderRadius: 10, background: theme.subtleBg, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={15} /> Add another list
            </div>
          ))}
      </div>
    </div>
  );
}
