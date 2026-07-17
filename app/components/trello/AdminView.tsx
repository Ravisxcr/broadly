"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useWorkspaces } from "../../lib/trello/contexts/WorkspacesContext";
import type { Role } from "../../lib/trello/types";

export default function AdminView() {
  const { theme } = useTheme();
  const { roster, availableUsers, addMember, removeMember, updateMemberRole } = useAuth();
  const { boards, updateBoard } = useBoards();
  const { workspaces, updateWorkspace } = useWorkspaces();
  const [roleError, setRoleError] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: Role) => {
    setRoleError(null);
    try {
      await updateMemberRole(userId, role);
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleAddMember = (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) addMember(user);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember(userId);
    boards.filter((b) => b.memberIds.includes(userId)).forEach((b) => updateBoard(b.id, { memberIds: b.memberIds.filter((id) => id !== userId) }));
    workspaces.filter((w) => w.memberIds.includes(userId)).forEach((w) => updateWorkspace(w.id, { memberIds: w.memberIds.filter((id) => id !== userId) }));
  };

  const toggleBoardAccess = (boardId: string, userId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;
    const memberIds = board.memberIds.includes(userId) ? board.memberIds.filter((id) => id !== userId) : [...board.memberIds, userId];
    updateBoard(boardId, { memberIds });
  };

  const toggleWorkspaceAccess = (workspaceId: string, userId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (!workspace) return;
    const memberIds = workspace.memberIds.includes(userId) ? workspace.memberIds.filter((id) => id !== userId) : [...workspace.memberIds, userId];
    updateWorkspace(workspaceId, { memberIds });
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
    <div style={{ maxWidth: "85%", margin: "0 auto" }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Members</div>
      <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
        People who can be invited onto boards in this workspace. There is always at least one admin, but there can be more than one — demoting the last remaining admin isn&apos;t allowed.
      </div>

      {roleError && <div style={{ fontSize: 12.5, color: "#DC2626", marginBottom: 12 }}>{roleError}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {roster.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: `1px solid ${theme.border}`, borderRadius: 9, background: theme.panelBg }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.color, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {m.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
            </div>
            <select
              value={m.role}
              onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
              style={{ padding: "6px 10px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 12.5, background: theme.inputBg, color: theme.text, flexShrink: 0 }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            {m.role !== "admin" && (
              <button
                onClick={() => handleRemoveMember(m.id)}
                style={{ width: 26, height: 26, flexShrink: 0, border: "none", background: theme.subtleBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <select
          value=""
          onChange={(e) => handleAddMember(e.target.value)}
          disabled={availableUsers.length === 0}
          style={{ width: "100%", padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
        >
          <option value="" disabled>
            {availableUsers.length === 0 ? "No registered users available to add" : "Add a registered user…"}
          </option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Workspace access</div>
      <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
        Members with workspace access can see every board in that workspace, current and future, without needing individual board access. Admins always see everything.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
        {workspaces.map((w) => (
          <div key={w.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 16px", background: theme.panelBg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: w.color }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{w.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roster.map((m) => {
                const hasAccess = w.memberIds.includes(m.id) || m.role === "admin";
                return (
                  <div
                    key={m.id}
                    onClick={() => m.role !== "admin" && toggleWorkspaceAccess(w.id, m.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px 5px 5px",
                      borderRadius: 20,
                      border: `1px solid ${theme.border}`,
                      cursor: m.role === "admin" ? "default" : "pointer",
                      opacity: hasAccess ? 1 : 0.4,
                      background: hasAccess ? theme.accentSubtle : theme.panelBg,
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: m.color, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {m.initials}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Board access</div>
      <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
        Grants access to a single board. Members with workspace access above already see every board here, whether or not they&apos;re toggled on below.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {boards.map((b) => (
          <div key={b.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 16px", background: theme.panelBg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: b.cover }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{b.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roster.map((m) => {
                const workspace = workspaces.find((w) => w.id === b.workspaceId);
                const hasWorkspaceAccess = !!workspace?.memberIds.includes(m.id);
                const hasAccess = b.memberIds.includes(m.id) || m.role === "admin" || hasWorkspaceAccess;
                return (
                  <div
                    key={m.id}
                    onClick={() => m.role !== "admin" && !hasWorkspaceAccess && toggleBoardAccess(b.id, m.id)}
                    title={hasWorkspaceAccess ? `${m.name} has access via workspace membership` : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px 5px 5px",
                      borderRadius: 20,
                      border: `1px solid ${theme.border}`,
                      cursor: m.role === "admin" || hasWorkspaceAccess ? "default" : "pointer",
                      opacity: hasAccess ? 1 : 0.4,
                      background: hasAccess ? theme.accentSubtle : theme.panelBg,
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: m.color, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {m.initials}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
