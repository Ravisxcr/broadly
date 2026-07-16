"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Plus } from "lucide-react";
import { groupByWorkspace } from "../../lib/trello/data";
import { useAnchoredMenu } from "../../lib/trello/hooks/useAnchoredMenu";
import { useVisibleBoards } from "../../lib/trello/hooks/useVisibleBoards";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useWorkspaces } from "../../lib/trello/contexts/WorkspacesContext";
import BoardCard from "./BoardCard";

const WORKSPACE_MENU_HEIGHT = 84;

interface DashboardViewProps {
  onOpenCreateBoard: (workspaceId?: string) => void;
  onOpenCreateWorkspace: () => void;
}

export default function DashboardView({ onOpenCreateBoard, onOpenCreateWorkspace }: DashboardViewProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const visibleBoards = useVisibleBoards();
  const { boards: allBoards } = useBoards();
  const { workspaces, updateWorkspace, deleteWorkspace } = useWorkspaces();

  const workspaceMenu = useAnchoredMenu();
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingWorkspaceNameValue, setEditingWorkspaceNameValue] = useState("");

  const startEditWorkspaceName = (workspaceId: string, currentName: string) => {
    setEditingWorkspaceId(workspaceId);
    setEditingWorkspaceNameValue(currentName);
    workspaceMenu.close();
  };
  const cancelEditWorkspaceName = () => setEditingWorkspaceId(null);
  const confirmEditWorkspaceName = () => {
    const workspaceId = editingWorkspaceId;
    const name = editingWorkspaceNameValue.trim();
    setEditingWorkspaceId(null);
    if (!workspaceId || !name) return;
    updateWorkspace(workspaceId, { name });
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    workspaceMenu.close();
    if (allBoards.some((b) => b.workspaceId === workspaceId)) {
      window.alert("Move or delete its boards first.");
      return;
    }
    if (!window.confirm("Delete this workspace? This can't be undone.")) return;
    deleteWorkspace(workspaceId);
  };

  const groups = groupByWorkspace(visibleBoards, workspaces).filter(({ boards: wsBoards }) => isAdmin || wsBoards.length > 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      {groups.map(({ workspace, boards: wsBoards }) => {
        const isEditingWs = editingWorkspaceId === workspace.id;
        const isWsMenuOpen = workspaceMenu.isOpen(workspace.id);

        return (
          <div key={workspace.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: workspace.color, flexShrink: 0 }} />
              {isEditingWs ? (
                <input
                  autoFocus
                  value={editingWorkspaceNameValue}
                  onChange={(e) => setEditingWorkspaceNameValue(e.target.value)}
                  onBlur={confirmEditWorkspaceName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEditWorkspaceName();
                    if (e.key === "Escape") cancelEditWorkspaceName();
                  }}
                  style={{ fontSize: 12, fontWeight: 700, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
                />
              ) : (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{workspace.name}</div>
              )}
              {isAdmin && !isEditingWs && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => workspaceMenu.toggle(workspace.id, e.currentTarget)}
                    title="Workspace options"
                    style={{ width: 22, height: 22, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", color: theme.textSecondary, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {isWsMenuOpen &&
                    workspaceMenu.rect &&
                    createPortal(
                      <>
                        <div onClick={workspaceMenu.close} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
                        <div
                          style={{
                            position: "fixed",
                            top:
                              window.innerHeight - workspaceMenu.rect.bottom < WORKSPACE_MENU_HEIGHT + 8
                                ? workspaceMenu.rect.top - WORKSPACE_MENU_HEIGHT - 4
                                : workspaceMenu.rect.bottom + 4,
                            left: workspaceMenu.rect.left,
                            width: 180,
                            background: theme.panelBg,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 10,
                            boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
                            zIndex: 71,
                            padding: 6,
                          }}
                        >
                          <div onClick={() => startEditWorkspaceName(workspace.id, workspace.name)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                            Rename workspace
                          </div>
                          <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                          <div onClick={() => handleDeleteWorkspace(workspace.id)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
                            Delete workspace
                          </div>
                        </div>
                      </>,
                      document.body
                    )}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, maxWidth: 920 }}>
              {wsBoards.map((b) => (
                <BoardCard key={b.id} board={b} />
              ))}
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
                  gap: 6,
                }}
              >
                <Plus size={14} /> Create new board
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
          <Plus size={14} /> New workspace
        </div>
      )}
    </div>
  );
}
