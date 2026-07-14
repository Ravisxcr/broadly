"use client";

import type { DragEvent } from "react";
import type { BoardData, Label, Member, ThemeColors } from "../../lib/trello/types";
import { labelById, memberById } from "../../lib/trello/data";

interface BoardViewProps {
  theme: ThemeColors;
  board: BoardData;
  roster: Member[];
  dragOverListId: string | null;
  onDragStartCard: (cardId: string, listId: string) => void;
  onDragOverList: (listId: string, e: DragEvent) => void;
  onDragLeaveList: () => void;
  onDropList: (listId: string, e: DragEvent) => void;
  onOpenCard: (cardId: string, listId: string) => void;
  addingCardListId: string | null;
  newCardTitle: string;
  onOpenAddCard: (listId: string) => void;
  onCancelAddCard: () => void;
  onNewCardTitleChange: (value: string) => void;
  onConfirmAddCard: (listId: string) => void;
  isAddingList: boolean;
  newListTitle: string;
  onOpenAddList: () => void;
  onCancelAddList: () => void;
  onNewListTitleChange: (value: string) => void;
  onConfirmAddList: () => void;
}

export default function BoardView({
  theme,
  board,
  roster,
  dragOverListId,
  onDragStartCard,
  onDragOverList,
  onDragLeaveList,
  onDropList,
  onOpenCard,
  addingCardListId,
  newCardTitle,
  onOpenAddCard,
  onCancelAddCard,
  onNewCardTitleChange,
  onConfirmAddCard,
  isAddingList,
  newListTitle,
  onOpenAddList,
  onCancelAddList,
  onNewListTitleChange,
  onConfirmAddList,
}: BoardViewProps) {
  return (
    <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px 20px", display: "flex", gap: 14, alignItems: "flex-start", background: theme.bgApp }}>
      {board.lists.map((list) => {
        const isOver = dragOverListId === list.id;
        const isAdding = addingCardListId === list.id;
        return (
          <div
            key={list.id}
            onDragOver={(e) => onDragOverList(list.id, e)}
            onDragLeave={onDragLeaveList}
            onDrop={(e) => onDropList(list.id, e)}
            style={{
              width: 264,
              flexShrink: 0,
              background: isOver ? "#EEF2FF" : theme.subtleBg,
              borderRadius: 10,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              maxHeight: "100%",
              border: `1.5px solid ${isOver ? "#4F46E5" : "transparent"}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "4px 6px 10px", fontSize: 13, fontWeight: 700, color: theme.text }}>
              {list.title}
              <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: theme.textSecondary, background: theme.panelBg, padding: "2px 7px", borderRadius: 10 }}>
                {list.cards.length}
              </div>
            </div>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "0 2px 4px" }}>
              {list.cards.map((c) => {
                const labels: Label[] = c.labelIds.map(labelById).filter((l): l is Label => Boolean(l));
                const members: Member[] = c.memberIds.map((id) => memberById(roster, id)).filter((m): m is Member => Boolean(m));
                const done = c.checklist.filter((i) => i.done).length;
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStartCard(c.id, list.id)}
                    onClick={() => onOpenCard(c.id, list.id)}
                    style={{
                      background: theme.panelBg,
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "grab",
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
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary }}>
                          ✓ {done}/{c.checklist.length}
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

            {isAdding ? (
              <div style={{ padding: "6px 2px 2px" }}>
                <textarea
                  autoFocus
                  value={newCardTitle}
                  onChange={(e) => onNewCardTitleChange(e.target.value)}
                  placeholder="Enter a title…"
                  style={{ width: "100%", minHeight: 52, padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, resize: "none", background: theme.inputBg, color: theme.text }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => onConfirmAddCard(list.id)}
                    style={{ padding: "7px 14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Add card
                  </button>
                  <button
                    onClick={onCancelAddCard}
                    style={{ padding: "7px 10px", background: "transparent", color: theme.textSecondary, border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => onOpenAddCard(list.id)}
                style={{ padding: "8px 8px", marginTop: 2, fontSize: 12.5, fontWeight: 700, color: theme.textSecondary, cursor: "pointer", borderRadius: 6 }}
              >
                + Add a card
              </div>
            )}
          </div>
        );
      })}

      {isAddingList ? (
        <div style={{ width: 264, flexShrink: 0, background: theme.panelBg, borderRadius: 10, padding: 10, border: `1.5px solid ${theme.border}` }}>
          <input
            autoFocus
            value={newListTitle}
            onChange={(e) => onNewListTitleChange(e.target.value)}
            placeholder="List name…"
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={onConfirmAddList}
              style={{ padding: "7px 14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              Add list
            </button>
            <button
              onClick={onCancelAddList}
              style={{ padding: "7px 10px", background: "transparent", color: theme.textSecondary, border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={onOpenAddList}
          style={{ width: 220, flexShrink: 0, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: theme.textSecondary, cursor: "pointer", borderRadius: 10, background: theme.subtleBg }}
        >
          + Add another list
        </div>
      )}
    </div>
  );
}
