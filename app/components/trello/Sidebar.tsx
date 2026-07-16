"use client";

import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Lock, MoreHorizontal, Plus, ShieldCheck } from "lucide-react";
import { groupByWorkspace } from "../../lib/trello/data";
import { useAnchoredMenu } from "../../lib/trello/hooks/useAnchoredMenu";
import { useVisibleBoards } from "../../lib/trello/hooks/useVisibleBoards";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useWorkspaces } from "../../lib/trello/contexts/WorkspacesContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";

const WORKSPACE_MENU_HEIGHT = 84;

interface SidebarProps {
  onOpenCreateBoard: (workspaceId?: string) => void;
  onOpenCreateWorkspace: () => void;
}

export default function Sidebar({ onOpenCreateBoard, onOpenCreateWorkspace }: SidebarProps) {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const boards = useVisibleBoards();
  const { workspaces, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const { view, activeBoardId, goToDashboard, goToAdmin, openBoard } = useNavigation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedWorkspaceIds, setCollapsedWorkspaceIds] = useState<string[]>([]);
  const workspaceMenu = useAnchoredMenu();
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingWorkspaceNameValue, setEditingWorkspaceNameValue] = useState("");

  const stopProp = (e: MouseEvent) => e.stopPropagation();

  const toggleWorkspaceCollapse = (workspaceId: string) =>
    setCollapsedWorkspaceIds((ids) => (ids.includes(workspaceId) ? ids.filter((id) => id !== workspaceId) : [...ids, workspaceId]));

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
    if (boards.some((b) => b.workspaceId === workspaceId)) {
      window.alert("Move or delete its boards first.");
      return;
    }
    if (!window.confirm("Delete this workspace? This can't be undone.")) return;
    deleteWorkspace(workspaceId);
  };

  return (
    <div
      style={{
        width: sidebarOpen ? 220 : 58,
        flexShrink: 0,
        background: theme.panelBg,
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.15s ease",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "flex-start" : "center",
          gap: 10,
          padding: sidebarOpen ? "18px 16px" : "14px 8px",
          borderBottom: `1px solid ${theme.border}`,
          whiteSpace: "nowrap",
        }}
      >
        {sidebarOpen && <div style={{ width: 26, height: 26, borderRadius: 7, background: "#4F46E5", flexShrink: 0 }} />}
        {sidebarOpen && <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Boardly</div>}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            marginLeft: sidebarOpen ? "auto" : 0,
            width: 26,
            height: 26,
            border: "none",
            background: theme.subtleBg,
            borderRadius: 6,
            cursor: "pointer",
            color: theme.textSecondary,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      <div
        style={{
          padding: sidebarOpen ? 16 : 8,
          display: "flex",
          flexDirection: "column",
          alignItems: sidebarOpen ? "stretch" : "center",
          gap: sidebarOpen ? 2 : 8,
          overflowY: "auto",
          overflowX: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div
          onClick={goToDashboard}
          title="Boards"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: sidebarOpen ? "8px 10px" : 6,
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: theme.textSecondary,
          }}
        >
          <span style={{ display: "flex", flexShrink: 0 }}>
            <LayoutGrid size={16} />
          </span>
          {sidebarOpen && "Boards"}
        </div>
        {isAdmin && (
          <div
            onClick={goToAdmin}
            title="Admin panel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: sidebarOpen ? "8px 10px" : 6,
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: theme.textSecondary,
            }}
          >
            <span style={{ display: "flex", flexShrink: 0 }}>
              <ShieldCheck size={16} />
            </span>
            {sidebarOpen && "Admin panel"}
          </div>
        )}

        {sidebarOpen && groupByWorkspace(boards, workspaces).map(({ workspace, boards: workspaceBoards }) => {
          const collapsed = sidebarOpen && collapsedWorkspaceIds.includes(workspace.id);
          const isEditingName = editingWorkspaceId === workspace.id;
          const isMenuOpen = workspaceMenu.isOpen(workspace.id);

          return (
            <div key={workspace.id}>
              {sidebarOpen && (
                <div
                  onClick={() => !isEditingName && toggleWorkspaceCollapse(workspace.id)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "14px 4px 6px", cursor: isEditingName ? "default" : "pointer", position: "relative" }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: workspace.color, flexShrink: 0 }} />
                  {isEditingName ? (
                    <input
                      autoFocus
                      onClick={stopProp}
                      value={editingWorkspaceNameValue}
                      onChange={(e) => setEditingWorkspaceNameValue(e.target.value)}
                      onBlur={confirmEditWorkspaceName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEditWorkspaceName();
                        if (e.key === "Escape") cancelEditWorkspaceName();
                      }}
                      style={{ flex: 1, fontSize: 11, fontWeight: 700, border: `1px solid ${theme.border}`, borderRadius: 5, padding: "2px 5px", fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
                    />
                  ) : (
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {workspace.name}
                    </span>
                  )}
                  {!isEditingName && (
                    <span style={{ color: theme.textSecondary, flexShrink: 0, display: "flex" }}>
                      {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                  {!isEditingName && (
                    <button
                      onClick={(e) => {
                        stopProp(e);
                        onOpenCreateBoard(workspace.id);
                      }}
                      title="Add board"
                      style={{ width: 20, height: 20, border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", color: theme.textSecondary, fontFamily: "inherit", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                  {isAdmin && !isEditingName && (
                    <div onClick={stopProp} style={{ position: "relative", flexShrink: 0 }}>
                      <button
                        onClick={(e) => workspaceMenu.toggle(workspace.id, e.currentTarget)}
                        title="Workspace options"
                        style={{ width: 20, height: 20, border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", color: theme.textSecondary, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {isMenuOpen &&
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
                                left: Math.max(8, workspaceMenu.rect.right - 160),
                                width: 160,
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
              )}

              {!collapsed &&
                workspaceBoards.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openBoard(b.id)}
                    title={b.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: sidebarOpen ? "8px 10px" : 6,
                      borderRadius: 7,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      background: b.id === activeBoardId && view === "board" ? theme.subtleBg : "transparent",
                    }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: b.cover, flexShrink: 0 }} />
                    {sidebarOpen && (
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.name}
                        {b.locked && (
                          <span style={{ marginLeft: 5, display: "inline-flex", verticalAlign: "middle" }}>
                            <Lock size={11} />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          );
        })}

        {sidebarOpen && isAdmin && (
          <div
            onClick={onOpenCreateWorkspace}
            title="New workspace"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: sidebarOpen ? "8px 10px" : 6,
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#4F46E5",
              marginTop: sidebarOpen ? 10 : 4,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px dashed #4F46E5", flexShrink: 0 }} />
            {sidebarOpen && "New workspace"}
          </div>
        )}
      </div>
    </div>
  );
}
