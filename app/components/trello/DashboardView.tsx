"use client";

import type { MouseEvent } from "react";
import type { BoardData, ThemeColors } from "../../lib/trello/types";

interface DashboardViewProps {
  theme: ThemeColors;
  boards: BoardData[];
  isAdmin: boolean;
  onOpenBoard: (boardId: string) => void;
  onOpenCreateBoard: () => void;
  boardMenuOpenId: string | null;
  onToggleBoardMenu: (boardId: string) => void;
  onCloseBoardMenu: () => void;
  editingBoardId: string | null;
  editingBoardNameValue: string;
  onStartEditBoardName: (boardId: string, currentName: string) => void;
  onEditingBoardNameChange: (value: string) => void;
  onConfirmEditBoardName: () => void;
  onCancelEditBoardName: () => void;
  onToggleLockBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
}

export default function DashboardView({
  theme,
  boards,
  isAdmin,
  onOpenBoard,
  onOpenCreateBoard,
  boardMenuOpenId,
  onToggleBoardMenu,
  onCloseBoardMenu,
  editingBoardId,
  editingBoardNameValue,
  onStartEditBoardName,
  onEditingBoardNameChange,
  onConfirmEditBoardName,
  onCancelEditBoardName,
  onToggleLockBoard,
  onDeleteBoard,
}: DashboardViewProps) {
  const stopProp = (e: MouseEvent) => e.stopPropagation();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your workspace</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, maxWidth: 920 }}>
        {boards.map((b) => {
          const isEditing = editingBoardId === b.id;
          const isMenuOpen = boardMenuOpenId === b.id;
          return (
            <div
              key={b.id}
              onClick={() => !isEditing && onOpenBoard(b.id)}
              style={{ height: 100, borderRadius: 10, background: b.cover, padding: 14, cursor: "pointer", display: "flex", alignItems: "flex-end", boxShadow: "0 6px 16px rgba(20,20,30,0.08)", position: "relative" }}
            >
              {isAdmin && (
                <div onClick={stopProp} style={{ position: "absolute", top: 8, right: 8 }}>
                  <button
                    onClick={() => onToggleBoardMenu(b.id)}
                    title="Board options"
                    style={{ width: 24, height: 24, border: "none", background: "rgba(0,0,0,0.25)", borderRadius: 6, cursor: "pointer", color: "#fff", fontSize: 13, fontFamily: "inherit" }}
                  >
                    ⋯
                  </button>
                  {isMenuOpen && (
                    <>
                      <div onClick={onCloseBoardMenu} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
                      <div style={{ position: "absolute", top: 28, right: 0, width: 170, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 6 }}>
                        <div onClick={() => onStartEditBoardName(b.id, b.name)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                          Rename board
                        </div>
                        <div onClick={() => onToggleLockBoard(b.id)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                          {b.locked ? "Unlock board" : "Lock board"}
                        </div>
                        <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                        <div onClick={() => onDeleteBoard(b.id)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
                          Delete board
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {b.locked && <div style={{ position: "absolute", top: 10, left: 12, fontSize: 13 }}>🔒</div>}
              {isEditing ? (
                <input
                  autoFocus
                  onClick={stopProp}
                  value={editingBoardNameValue}
                  onChange={(e) => onEditingBoardNameChange(e.target.value)}
                  onBlur={onConfirmEditBoardName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onConfirmEditBoardName();
                    if (e.key === "Escape") onCancelEditBoardName();
                  }}
                  style={{ width: "100%", fontSize: 15, fontWeight: 800, border: "1px solid #fff", borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", background: "rgba(255,255,255,0.9)", color: "#1F2430" }}
                />
              ) : (
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{b.name}</div>
              )}
            </div>
          );
        })}
        <div
          onClick={onOpenCreateBoard}
          style={{
            height: 100,
            borderRadius: 10,
            background: theme.subtleBg,
            border: `1.5px dashed ${theme.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.textSecondary,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          + Create new board
        </div>
      </div>
    </div>
  );
}
