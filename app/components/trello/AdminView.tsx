"use client";

import type { BoardData, Member, ThemeColors } from "../../lib/trello/types";

interface AdminViewProps {
  theme: ThemeColors;
  roster: Member[];
  boards: BoardData[];
  inviteName: string;
  inviteEmail: string;
  onInviteNameChange: (value: string) => void;
  onInviteEmailChange: (value: string) => void;
  onInviteMember: () => void;
  onRemoveMember: (memberId: string) => void;
  onToggleBoardAccess: (boardId: string, memberId: string) => void;
}

export default function AdminView({
  theme,
  roster,
  boards,
  inviteName,
  inviteEmail,
  onInviteNameChange,
  onInviteEmailChange,
  onInviteMember,
  onRemoveMember,
  onToggleBoardAccess,
}: AdminViewProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
    <div style={{ maxWidth: "85%", margin: "0 auto" }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Members</div>
      <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>People who can be invited onto boards in this workspace.</div>

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
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", background: "#EEF2FF", padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>
              {m.role === "admin" ? "Admin" : "Member"}
            </div>
            {m.role !== "admin" && (
              <button
                onClick={() => onRemoveMember(m.id)}
                style={{ width: 26, height: 26, flexShrink: 0, border: "none", background: theme.subtleBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, fontSize: 13 }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
        <input
          value={inviteName}
          onChange={(e) => onInviteNameChange(e.target.value)}
          placeholder="Name"
          style={{ flex: "1 1 140px", minWidth: 0, padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
        />
        <input
          value={inviteEmail}
          onChange={(e) => onInviteEmailChange(e.target.value)}
          placeholder="Email"
          style={{ flex: "1 1 140px", minWidth: 0, padding: "9px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontFamily: "inherit", fontSize: 13, background: theme.inputBg, color: theme.text }}
        />
        <button
          onClick={onInviteMember}
          style={{ flexShrink: 0, padding: "9px 18px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Invite
        </button>
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Board access</div>
      <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>Only members with access can see a board. Admins always see everything.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {boards.map((b) => (
          <div key={b.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 16px", background: theme.panelBg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: b.cover }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{b.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roster.map((m) => {
                const hasAccess = b.memberIds.includes(m.id) || m.role === "admin";
                return (
                  <div
                    key={m.id}
                    onClick={() => onToggleBoardAccess(b.id, m.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px 5px 5px",
                      borderRadius: 20,
                      border: `1px solid ${theme.border}`,
                      cursor: "pointer",
                      opacity: hasAccess ? 1 : 0.4,
                      background: hasAccess ? "#EEF2FF" : "#fff",
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
