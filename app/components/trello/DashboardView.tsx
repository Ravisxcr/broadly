"use client";

import type { MouseEvent } from "react";
import { groupByWorkspace } from "../../lib/trello/data";
import type { BoardData, Member, ThemeColors, WorkspaceData } from "../../lib/trello/types";

interface DashboardViewProps {
  theme: ThemeColors;
  boards: BoardData[];
  workspaces: WorkspaceData[];
  roster: Member[];
  isAdmin: boolean;
  onOpenBoard: (boardId: string) => void;
  onOpenCreateBoard: (workspaceId?: string) => void;
  boardMenuOpenId: string | null;
  onToggleBoardMenu: (boardId: string) => void;
  onCloseBoardMenu: () => void;
  boardInfoOpenId: string | null;
  onOpenBoardInfo: (boardId: string) => void;
  onCloseBoardInfo: () => void;
  editingBoardId: string | null;
  editingBoardNameValue: string;
  onStartEditBoardName: (boardId: string, currentName: string) => void;
  onEditingBoardNameChange: (value: string) => void;
  onConfirmEditBoardName: () => void;
  onCancelEditBoardName: () => void;
  onToggleLockBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onOpenCreateWorkspace: () => void;
  workspaceMenuOpenId: string | null;
  onToggleWorkspaceMenu: (workspaceId: string) => void;
  onCloseWorkspaceMenu: () => void;
  editingWorkspaceId: string | null;
  editingWorkspaceNameValue: string;
  onStartEditWorkspaceName: (workspaceId: string, currentName: string) => void;
  onEditingWorkspaceNameChange: (value: string) => void;
  onConfirmEditWorkspaceName: () => void;
  onCancelEditWorkspaceName: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
}

export default function DashboardView({
  theme,
  boards,
  workspaces,
  roster,
  isAdmin,
  onOpenBoard,
  onOpenCreateBoard,
  boardMenuOpenId,
  onToggleBoardMenu,
  onCloseBoardMenu,
  boardInfoOpenId,
  onOpenBoardInfo,
  onCloseBoardInfo,
  editingBoardId,
  editingBoardNameValue,
  onStartEditBoardName,
  onEditingBoardNameChange,
  onConfirmEditBoardName,
  onCancelEditBoardName,
  onToggleLockBoard,
  onDeleteBoard,
  onOpenCreateWorkspace,
  workspaceMenuOpenId,
  onToggleWorkspaceMenu,
  onCloseWorkspaceMenu,
  editingWorkspaceId,
  editingWorkspaceNameValue,
  onStartEditWorkspaceName,
  onEditingWorkspaceNameChange,
  onConfirmEditWorkspaceName,
  onCancelEditWorkspaceName,
  onDeleteWorkspace,
}: DashboardViewProps) {
  const stopProp = (e: MouseEvent) => e.stopPropagation();

  const groups = groupByWorkspace(boards, workspaces).filter(({ boards: wsBoards }) => isAdmin || wsBoards.length > 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      {groups.map(({ workspace, boards: wsBoards }) => {
        const isEditingWs = editingWorkspaceId === workspace.id;
        const isWsMenuOpen = workspaceMenuOpenId === workspace.id;

        return (
          <div key={workspace.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: workspace.color, flexShrink: 0 }} />
              {isEditingWs ? (
                <input
                  autoFocus
                  value={editingWorkspaceNameValue}
                  onChange={(e) => onEditingWorkspaceNameChange(e.target.value)}
                  onBlur={onConfirmEditWorkspaceName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onConfirmEditWorkspaceName();
                    if (e.key === "Escape") onCancelEditWorkspaceName();
                  }}
                  style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
                />
              ) : (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{workspace.name}</div>
              )}
              {isAdmin && !isEditingWs && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => onToggleWorkspaceMenu(workspace.id)}
                    title="Workspace options"
                    style={{ width: 22, height: 22, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", color: theme.textSecondary, fontSize: 13, fontFamily: "inherit" }}
                  >
                    ⋯
                  </button>
                  {isWsMenuOpen && (
                    <>
                      <div onClick={onCloseWorkspaceMenu} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
                      <div style={{ position: "absolute", top: 24, left: 0, width: 180, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 6 }}>
                        <div onClick={() => onStartEditWorkspaceName(workspace.id, workspace.name)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                          Rename workspace
                        </div>
                        <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                        <div onClick={() => onDeleteWorkspace(workspace.id)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
                          Delete workspace
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, maxWidth: 920 }}>
              {wsBoards.map((b) => {
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
                              <div onClick={() => onOpenBoardInfo(b.id)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                                Board info
                              </div>
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
                        {boardInfoOpenId === b.id && (
                          <BoardInfoPanel theme={theme} board={b} roster={roster} onClose={onCloseBoardInfo} />
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
                onClick={() => onOpenCreateBoard(workspace.id)}
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
      })}

      {isAdmin && (
        <div
          onClick={onOpenCreateWorkspace}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            borderRadius: 8,
            border: `1.5px dashed ${theme.border}`,
            cursor: "pointer",
            color: theme.textSecondary,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          + New workspace
        </div>
      )}
    </div>
  );
}

function BoardInfoPanel({
  theme,
  board,
  roster,
  onClose,
}: {
  theme: ThemeColors;
  board: BoardData;
  roster: Member[];
  onClose: () => void;
}) {
  const stopProp = (e: MouseEvent) => e.stopPropagation();
  const members = board.memberIds.map((id) => roster.find((m) => m.id === id)).filter((m): m is Member => !!m);
  const creator = members[0] ?? null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.35)" }} />
      <div
        onClick={stopProp}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          maxWidth: "90vw",
          background: theme.panelBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          boxShadow: "0 20px 48px rgba(0,0,0,0.24)",
          zIndex: 81,
          padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>{board.name}</div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", color: theme.textSecondary, cursor: "pointer", fontSize: 16, fontFamily: "inherit", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Created by
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {creator ? (
            <>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: creator.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {creator.initials}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{creator.name}</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: theme.textSecondary }}>Unknown</div>
          )}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Members ({members.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: theme.textSecondary }}>{m.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
