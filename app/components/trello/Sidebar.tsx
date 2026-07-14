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
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 16px", borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "#4F46E5", flexShrink: 0 }} />
        {sidebarOpen && <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Boardly</div>}
        <button
          onClick={onToggleSidebar}
          style={{ marginLeft: "auto", width: 26, height: 26, border: "none", background: theme.subtleBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, flexShrink: 0 }}
        >
          {sidebarOpen ? "‹" : "›"}
        </button>
      </div>

      {sidebarOpen && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", whiteSpace: "nowrap" }}>
          <div
            onClick={onGoToDashboard}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 700, color: theme.textSecondary }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, background: theme.textSecondary, opacity: 0.3 }} />
            Boards
          </div>
          {isAdmin && (
            <div
              onClick={onGoToAdmin}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 700, color: theme.textSecondary }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, background: "#4F46E5", opacity: 0.5 }} />
              Admin panel
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", padding: "14px 10px 6px" }}>Workspace</div>

          {boards.map((b) => (
            <div
              key={b.id}
              onClick={() => onOpenBoard(b.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: b.id === activeBoardId && view === "board" ? "#F4F3F0" : "transparent",
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, background: b.cover, flexShrink: 0 }} />
              {b.name}
            </div>
          ))}

          <div
            onClick={onOpenCreateBoard}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#4F46E5", marginTop: 4 }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px dashed #4F46E5", flexShrink: 0 }} />
            New board
          </div>
        </div>
      )}
    </div>
  );
}
