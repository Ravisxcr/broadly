"use client";

import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Lock, MoreHorizontal, Plus } from "lucide-react";
import { groupByWorkspace } from "../../lib/trello/data";
import type { BoardData, ThemeColors, ViewName, WorkspaceData } from "../../lib/trello/types";

const WORKSPACE_MENU_HEIGHT = 84;

interface SidebarProps {
  theme: ThemeColors;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  boards: BoardData[];
  workspaces: WorkspaceData[];
  activeBoardId: string | null;
  view: ViewName;
  isAdmin: boolean;
  onGoToDashboard: () => void;
  onGoToAdmin: () => void;
  onOpenBoard: (boardId: string) => void;
  onOpenCreateBoard: (workspaceId?: string) => void;
  collapsedWorkspaceIds: string[];
  onToggleWorkspaceCollapse: (workspaceId: string) => void;
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

export default function Sidebar({
  theme,
  sidebarOpen,
  onToggleSidebar,
  boards,
  workspaces,
  activeBoardId,
  view,
  isAdmin,
  onGoToDashboard,
  onGoToAdmin,
  onOpenBoard,
  onOpenCreateBoard,
  collapsedWorkspaceIds,
  onToggleWorkspaceCollapse,
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
}: SidebarProps) {
  const stopProp = (e: MouseEvent) => e.stopPropagation();
  const [workspaceMenuRect, setWorkspaceMenuRect] = useState<DOMRect | null>(null);

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
          onClick={onToggleSidebar}
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
          onClick={onGoToDashboard}
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
          <div style={{ width: 16, height: 16, borderRadius: 4, background: theme.textSecondary, opacity: 0.3, flexShrink: 0 }} />
          {sidebarOpen && "Boards"}
        </div>
        {isAdmin && (
          <div
            onClick={onGoToAdmin}
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
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "#4F46E5", opacity: 0.5, flexShrink: 0 }} />
            {sidebarOpen && "Admin panel"}
          </div>
        )}

        {groupByWorkspace(boards, workspaces).map(({ workspace, boards: workspaceBoards }) => {
          const collapsed = sidebarOpen && collapsedWorkspaceIds.includes(workspace.id);
          const isEditingName = editingWorkspaceId === workspace.id;
          const isMenuOpen = workspaceMenuOpenId === workspace.id;

          return (
            <div key={workspace.id}>
              {sidebarOpen && (
                <div
                  onClick={() => !isEditingName && onToggleWorkspaceCollapse(workspace.id)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "14px 4px 6px", cursor: isEditingName ? "default" : "pointer", position: "relative" }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: workspace.color, flexShrink: 0 }} />
                  {isEditingName ? (
                    <input
                      autoFocus
                      onClick={stopProp}
                      value={editingWorkspaceNameValue}
                      onChange={(e) => onEditingWorkspaceNameChange(e.target.value)}
                      onBlur={onConfirmEditWorkspaceName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onConfirmEditWorkspaceName();
                        if (e.key === "Escape") onCancelEditWorkspaceName();
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
                        onClick={(e) => {
                          setWorkspaceMenuRect(e.currentTarget.getBoundingClientRect());
                          onToggleWorkspaceMenu(workspace.id);
                        }}
                        title="Workspace options"
                        style={{ width: 20, height: 20, border: "none", background: "transparent", borderRadius: 5, cursor: "pointer", color: theme.textSecondary, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {isMenuOpen &&
                        workspaceMenuRect &&
                        createPortal(
                          <>
                            <div onClick={onCloseWorkspaceMenu} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
                            <div
                              style={{
                                position: "fixed",
                                top:
                                  window.innerHeight - workspaceMenuRect.bottom < WORKSPACE_MENU_HEIGHT + 8
                                    ? workspaceMenuRect.top - WORKSPACE_MENU_HEIGHT - 4
                                    : workspaceMenuRect.bottom + 4,
                                left: Math.max(8, workspaceMenuRect.right - 160),
                                width: 160,
                                background: theme.panelBg,
                                border: `1px solid ${theme.border}`,
                                borderRadius: 10,
                                boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
                                zIndex: 71,
                                padding: 6,
                              }}
                            >
                              <div onClick={() => onStartEditWorkspaceName(workspace.id, workspace.name)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                                Rename workspace
                              </div>
                              <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                              <div onClick={() => onDeleteWorkspace(workspace.id)} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
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
                    onClick={() => onOpenBoard(b.id)}
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
                      background: b.id === activeBoardId && view === "board" ? "#F4F3F0" : "transparent",
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

        {isAdmin && (
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
