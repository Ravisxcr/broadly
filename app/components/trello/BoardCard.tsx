"use client";

import { useState, type MouseEvent } from "react";
import { Lock, MoreHorizontal, X } from "lucide-react";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";
import type { BoardData, Member, ThemeColors } from "../../lib/trello/types";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface BoardCardProps {
  board: BoardData;
}

export default function BoardCard({ board }: BoardCardProps) {
  const { theme } = useTheme();
  const { roster, isAdmin } = useAuth();
  const { updateBoard, deleteBoard } = useBoards();
  const { openBoard } = useNavigation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(board.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const stopProp = (e: MouseEvent) => e.stopPropagation();

  const startEdit = () => {
    setNameDraft(board.name);
    setEditing(true);
    setMenuOpen(false);
  };
  const confirmEdit = () => {
    const name = nameDraft.trim();
    setEditing(false);
    if (!name) return;
    updateBoard(board.id, { name });
  };
  const cancelEdit = () => setEditing(false);

  const toggleLock = () => {
    setMenuOpen(false);
    updateBoard(board.id, { locked: !board.locked });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setConfirmingDelete(true);
  };
  const confirmDelete = () => deleteBoard(board.id);

  return (
    <div
      onClick={() => !editing && openBoard(board.id)}
      style={{ height: 100, borderRadius: 10, background: board.cover, padding: 14, cursor: "pointer", display: "flex", alignItems: "flex-end", boxShadow: "0 6px 16px rgba(20,20,30,0.08)", position: "relative" }}
    >
      {isAdmin && (
        <div onClick={stopProp} style={{ position: "absolute", top: 8, right: 8 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="Board options"
            style={{ width: 24, height: 24, border: "none", background: "rgba(0,0,0,0.25)", borderRadius: 6, cursor: "pointer", color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
              <div style={{ position: "absolute", top: 28, right: 0, width: 170, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 6 }}>
                <div
                  onClick={() => {
                    setInfoOpen(true);
                    setMenuOpen(false);
                  }}
                  style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}
                >
                  Board info
                </div>
                <div onClick={startEdit} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                  Rename board
                </div>
                <div onClick={toggleLock} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                  {board.locked ? "Unlock board" : "Lock board"}
                </div>
                <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                <div onClick={handleDelete} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
                  Delete board
                </div>
              </div>
            </>
          )}
          {infoOpen && <BoardInfoPanel theme={theme} board={board} roster={roster} onClose={() => setInfoOpen(false)} />}
          <div onClick={stopProp}>
            <ConfirmDeleteDialog
              open={confirmingDelete}
              onOpenChange={setConfirmingDelete}
              title="Delete this board?"
              description={`"${board.name}" and all of its lists and cards will be permanently deleted. This can't be undone.`}
              confirmLabel="Delete board"
              onConfirm={confirmDelete}
            />
          </div>
        </div>
      )}
      {board.locked && <div style={{ position: "absolute", top: 10, left: 12, color: "#fff", display: "flex" }}><Lock size={13} /></div>}
      {editing ? (
        <input
          autoFocus
          onClick={stopProp}
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={confirmEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          style={{ width: "100%", fontSize: 15, fontWeight: 800, border: "1px solid #fff", borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", background: "rgba(255,255,255,0.9)", color: "#1F2430" }}
        />
      ) : (
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{board.name}</div>
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
            style={{ border: "none", background: "transparent", color: theme.textSecondary, cursor: "pointer", fontFamily: "inherit", lineHeight: 1, display: "flex" }}
          >
            <X size={16} />
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
