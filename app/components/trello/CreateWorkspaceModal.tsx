"use client";

import { useState, type MouseEvent } from "react";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useWorkspaces } from "../../lib/trello/contexts/WorkspacesContext";

interface CreateWorkspaceModalProps {
  onClose: () => void;
}

export default function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  const { theme } = useTheme();
  const { createWorkspace } = useWorkspaces();
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const stopProp = (e: MouseEvent) => e.stopPropagation();

  const handleCreate = () => {
    const name = newWorkspaceName.trim();
    onClose();
    if (!name) return;
    createWorkspace({ name });
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,25,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}
    >
      <div onClick={stopProp} style={{ width: 400, maxWidth: "100%", background: theme.panelBg, color: theme.text, borderRadius: 12, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Create workspace</div>

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#B3AFA6", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Workspace name</label>
        <input
          autoFocus
          value={newWorkspaceName}
          onChange={(e) => setNewWorkspaceName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") onClose();
          }}
          placeholder="e.g. Marketing Team"
          style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 8, fontFamily: "inherit", fontSize: 14, marginBottom: 20, background: theme.inputBg, color: theme.text }}
        />

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
            Create workspace
          </button>
        </div>
      </div>
    </div>
  );
}
