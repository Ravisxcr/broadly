"use client";

import { useState, type DragEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { labelById, memberById } from "../../lib/trello/data";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";
import type { Label, ListData, Member } from "../../lib/trello/types";

interface ListColumnProps {
  list: ListData;
  locked: boolean;
  isDragOver: boolean;
  onDragOverList: (e: DragEvent) => void;
  onDragLeaveList: () => void;
  onDropList: (e: DragEvent) => void;
  onDragStartCard: (cardId: string) => void;
}

export default function ListColumn({ list, locked, isDragOver, onDragOverList, onDragLeaveList, onDropList, onDragStartCard }: ListColumnProps) {
  const { theme } = useTheme();
  const { roster } = useAuth();
  const { renameList, deleteList, addCard } = useBoards();
  const { activeBoardId, selectedListId, openCard, closeCard } = useNavigation();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardTitleDraft, setCardTitleDraft] = useState("");

  const startEditTitle = () => {
    setTitleDraft(list.title);
    setIsEditingTitle(true);
  };
  const cancelEditTitle = () => setIsEditingTitle(false);
  const confirmEditTitle = () => {
    const title = titleDraft.trim();
    setIsEditingTitle(false);
    if (!activeBoardId || !title) return;
    renameList(activeBoardId, list.id, title);
  };

  const handleDeleteList = () => {
    if (selectedListId === list.id) closeCard();
    if (!activeBoardId) return;
    deleteList(activeBoardId, list.id);
  };

  const openAddCard = () => {
    setCardTitleDraft("");
    setIsAddingCard(true);
  };
  const cancelAddCard = () => setIsAddingCard(false);
  const confirmAddCard = () => {
    const title = cardTitleDraft.trim();
    setIsAddingCard(false);
    if (!activeBoardId || !title) return;
    addCard(activeBoardId, list.id, title);
  };

  return (
    <div
      onDragOver={onDragOverList}
      onDragLeave={onDragLeaveList}
      onDrop={onDropList}
      style={{
        width: 264,
        flexShrink: 0,
        background: isDragOver ? "#EEF2FF" : theme.subtleBg,
        borderRadius: 10,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        border: `1.5px solid ${isDragOver ? "#4F46E5" : "transparent"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px 10px", fontSize: 13, fontWeight: 700, color: theme.text }}>
        {isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={confirmEditTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmEditTitle();
              if (e.key === "Escape") cancelEditTitle();
            }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "3px 6px",
              border: `1px solid #4F46E5`,
              borderRadius: 5,
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              background: theme.inputBg,
              color: theme.text,
            }}
          />
        ) : (
          <div
            onClick={() => !locked && startEditTitle()}
            title={locked ? undefined : "Rename list"}
            style={{ flex: 1, minWidth: 0, cursor: locked ? "default" : "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {list.title}
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary, background: theme.panelBg, padding: "2px 7px", borderRadius: 10 }}>
          {list.cards.length}
        </div>
        {!locked && (
          <button
            onClick={handleDeleteList}
            title="Delete list"
            style={{
              border: "none",
              background: "transparent",
              color: theme.textSecondary,
              cursor: "pointer",
              lineHeight: 1,
              padding: "2px 4px",
              borderRadius: 5,
              fontFamily: "inherit",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "0 2px 4px" }}>
        {list.cards.map((c) => {
          const labels: Label[] = c.labelIds.map(labelById).filter((l): l is Label => Boolean(l));
          const members: Member[] = c.memberIds.map((id) => memberById(roster, id)).filter((m): m is Member => Boolean(m));
          const done = c.checklist.filter((i) => i.done).length;
          return (
            <div
              key={c.id}
              draggable={!locked}
              onDragStart={() => !locked && onDragStartCard(c.id)}
              onClick={() => openCard(c.id, list.id)}
              style={{
                background: theme.panelBg,
                borderRadius: 8,
                padding: "10px 12px",
                cursor: locked ? "pointer" : "grab",
                boxShadow: "0 1px 2px rgba(20,20,30,0.08)",
                border: `1px solid ${theme.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {labels.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {labels.map((lab) => (
                    <div key={lab.id} style={{ width: 28, height: 7, borderRadius: 4, background: lab.color }} />
                  ))}
                </div>
              )}

              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: theme.text }}>{c.title}</div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {c.due && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary, background: theme.subtleBg, padding: "2px 7px", borderRadius: 5 }}>{c.due}</div>
                )}
                {c.checklist.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary, display: "flex", alignItems: "center", gap: 3 }}>
                    <Check size={12} /> {done}/{c.checklist.length}
                  </div>
                )}
                <div style={{ marginLeft: "auto", display: "flex" }}>
                  {members.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: m.color,
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: -6,
                        border: "1.5px solid #fff",
                      }}
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!locked &&
        (isAddingCard ? (
          <div style={{ padding: "6px 2px 2px" }}>
            <textarea
              autoFocus
              value={cardTitleDraft}
              onChange={(e) => setCardTitleDraft(e.target.value)}
              placeholder="Enter a title…"
              style={{ width: "100%", minHeight: 52, padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, resize: "none", background: theme.inputBg, color: theme.text }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                onClick={confirmAddCard}
                style={{ padding: "7px 14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              >
                Add card
              </button>
              <button
                onClick={cancelAddCard}
                style={{ padding: "7px 10px", background: "transparent", color: theme.textSecondary, border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={openAddCard}
            style={{ padding: "8px 8px", marginTop: 2, fontSize: 12.5, fontWeight: 700, color: theme.textSecondary, cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", gap: 5 }}
          >
            <Plus size={14} /> Add a card
          </div>
        ))}
    </div>
  );
}
