"use client";

import type { BoardData, ThemeColors } from "../../lib/trello/types";

interface DashboardViewProps {
  theme: ThemeColors;
  boards: BoardData[];
  onOpenBoard: (boardId: string) => void;
  onOpenCreateBoard: () => void;
}

export default function DashboardView({ theme, boards, onOpenBoard, onOpenCreateBoard }: DashboardViewProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Your workspace</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, maxWidth: 920 }}>
        {boards.map((b) => (
          <div
            key={b.id}
            onClick={() => onOpenBoard(b.id)}
            style={{ height: 100, borderRadius: 10, background: b.cover, padding: 14, cursor: "pointer", display: "flex", alignItems: "flex-end", boxShadow: "0 6px 16px rgba(20,20,30,0.08)" }}
          >
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{b.name}</div>
          </div>
        ))}
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
