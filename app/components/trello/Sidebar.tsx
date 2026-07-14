"use client";

import type { BoardData, ThemeColors, ViewName } from "../../lib/trello/types";

interface SidebarProps {
  theme: ThemeColors;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  boards: BoardData[];
  activeBoardId: string | null;
  view: ViewName;
  isAdmin: boolean;
  onGoToDashboard: () => void;
  onGoToAdmin: () => void;
  onOpenBoard: (boardId: string) => void;
  onOpenCreateBoard: () => void;
}

export default function Sidebar({
  theme,
  sidebarOpen,
  onToggleSidebar,
  boards,
  activeBoardId,
  view,
  isAdmin,
  onGoToDashboard,
  onGoToAdmin,
  onOpenBoard,
  onOpenCreateBoard,
}: SidebarProps) {
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
          }}
        >
          {sidebarOpen ? "‹" : "›"}
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
        {sidebarOpen && (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", padding: "14px 10px 6px" }}>Workspace</div>
        )}

        {boards.map((b) => (
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
                {b.locked && <span style={{ marginLeft: 5, fontSize: 11 }}>🔒</span>}
              </span>
            )}
          </div>
        ))}

        <div
          onClick={onOpenCreateBoard}
          title="New board"
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
            marginTop: sidebarOpen ? 4 : 0,
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px dashed #4F46E5", flexShrink: 0 }} />
          {sidebarOpen && "New board"}
        </div>
      </div>
    </div>
  );
}
