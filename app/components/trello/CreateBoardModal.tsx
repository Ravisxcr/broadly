"use client";

import { useState, type MouseEvent } from "react";
import { COLUMN_TEMPLATES } from "../../lib/trello/data";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useWorkspaces } from "../../lib/trello/contexts/WorkspacesContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";

interface CreateBoardModalProps {
  initialWorkspaceId?: string;
  onClose: () => void;
}

export default function CreateBoardModal({ initialWorkspaceId, onClose }: CreateBoardModalProps) {
  const { theme } = useTheme();
  const { currentUserId } = useAuth();
  const { createBoard } = useBoards();
  const { workspaces } = useWorkspaces();
  const { openBoard } = useNavigation();

  const [newBoardName, setNewBoardName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("todo3");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialWorkspaceId ?? workspaces[0]?.id ?? "");
  const stopProp = (e: MouseEvent) => e.stopPropagation();

  const handleCreate = async () => {
    const name = newBoardName.trim() || "New Board";
    const memberIds = currentUserId ? [currentUserId] : [];
    const workspaceId = selectedWorkspaceId || workspaces[0]?.id || "";
    onClose();
    const board = await createBoard({ name, templateId: selectedTemplateId, memberIds, workspaceId });
    openBoard(board.id);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,25,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}
    >
      <div onClick={stopProp} style={{ width: 460, maxWidth: "100%", background: theme.panelBg, color: theme.text, borderRadius: 12, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Create board</div>

        {workspaces.length > 1 && (
          <>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Workspace</label>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 14, marginBottom: 18, background: theme.inputBg, color: theme.text }}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </>
        )}

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Board name</label>
        <input
          autoFocus
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder="e.g. Website Redesign"
          style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 14, marginBottom: 18, background: theme.inputBg, color: theme.text }}
        />

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Column layout</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {COLUMN_TEMPLATES.map((t) => {
            const selected = selectedTemplateId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                style={{ padding: "10px 12px", border: `1.5px solid ${selected ? theme.accent : theme.border}`, background: selected ? theme.accentSubtle : theme.panelBg, borderRadius: 9, cursor: "pointer" }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.text }}>{t.name}</div>
                <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{t.desc}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 16px", background: "transparent", color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            style={{ padding: "9px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
          >
            Create board
          </button>
        </div>
      </div>
    </div>
  );
}
