"use client";

import type { BoardData, Member, ThemeColors, ThemeMode, ViewName } from "../../lib/trello/types";

interface TopNavProps {
  theme: ThemeColors;
  themeMode: ThemeMode;
  view: ViewName;
  activeBoard: BoardData | null;
  isAdmin: boolean;
  currentUser: Member | undefined;
  profileMenuOpen: boolean;
  onToggleProfileMenu: () => void;
  onCloseProfileMenu: () => void;
  onGoToDashboard: () => void;
  onGoToAdmin: () => void;
  onLogout: () => void;
  onSetLightTheme: () => void;
  onSetDarkTheme: () => void;
  boardMenuOpen: boolean;
  onToggleBoardMenu: () => void;
  onCloseBoardMenu: () => void;
  editingBoardName: boolean;
  editingBoardNameValue: string;
  onStartEditBoardName: () => void;
  onEditingBoardNameChange: (value: string) => void;
  onConfirmEditBoardName: () => void;
  onCancelEditBoardName: () => void;
  onToggleLockBoard: () => void;
  onDeleteBoard: () => void;
}

export default function TopNav({
  theme,
  themeMode,
  view,
  activeBoard,
  isAdmin,
  currentUser,
  profileMenuOpen,
  onToggleProfileMenu,
  onCloseProfileMenu,
  onGoToDashboard,
  onGoToAdmin,
  onLogout,
  onSetLightTheme,
  onSetDarkTheme,
  boardMenuOpen,
  onToggleBoardMenu,
  onCloseBoardMenu,
  editingBoardName,
  editingBoardNameValue,
  onStartEditBoardName,
  onEditingBoardNameChange,
  onConfirmEditBoardName,
  onCancelEditBoardName,
  onToggleLockBoard,
  onDeleteBoard,
}: TopNavProps) {
  const dark = themeMode === "dark";

  return (
    <div style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", borderBottom: `1px solid ${theme.border}`, background: theme.panelBg }}>
      {view === "board" && activeBoard && (
        <>
          <button
            onClick={onGoToDashboard}
            style={{ width: 30, height: 30, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: 7, cursor: "pointer", color: theme.textSecondary, fontSize: 14 }}
          >
            ←
          </button>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: activeBoard.cover, flexShrink: 0 }} />
          {editingBoardName ? (
            <input
              autoFocus
              value={editingBoardNameValue}
              onChange={(e) => onEditingBoardNameChange(e.target.value)}
              onBlur={onConfirmEditBoardName}
              onKeyDown={(e) => {
                if (e.key === "Enter") onConfirmEditBoardName();
                if (e.key === "Escape") onCancelEditBoardName();
              }}
              style={{ fontSize: 15, fontWeight: 800, border: `1px solid #4F46E5`, borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
            />
          ) : (
            <div style={{ fontSize: 15, fontWeight: 800 }}>{activeBoard.name}</div>
          )}
          {activeBoard.locked && (
            <div title="Board is locked" style={{ fontSize: 12 }}>
              🔒
            </div>
          )}
          {isAdmin && !editingBoardName && (
            <div style={{ position: "relative" }}>
              <button
                onClick={onToggleBoardMenu}
                title="Board options"
                style={{ width: 26, height: 26, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, fontSize: 13, fontFamily: "inherit" }}
              >
                ⋯
              </button>
              {boardMenuOpen && (
                <>
                  <div onClick={onCloseBoardMenu} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
                  <div style={{ position: "absolute", top: 32, left: 0, width: 180, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 6 }}>
                    <div onClick={onStartEditBoardName} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                      Rename board
                    </div>
                    <div onClick={onToggleLockBoard} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                      {activeBoard.locked ? "Unlock board" : "Lock board"}
                    </div>
                    <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                    <div onClick={onDeleteBoard} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
                      Delete board
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      {view === "dashboard" && <div style={{ fontSize: 15, fontWeight: 800 }}>Your boards</div>}
      {view === "admin" && <div style={{ fontSize: 15, fontWeight: 800 }}>Admin panel</div>}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <input
          placeholder="Search…"
          style={{ width: 180, padding: "8px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontSize: 13, fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
        />
        <div
          onClick={onToggleProfileMenu}
          title={currentUser?.name}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          {currentUser?.initials}
        </div>

        {profileMenuOpen && (
          <>
            <div onClick={onCloseProfileMenu} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
            <div style={{ position: "absolute", top: 40, right: 0, width: 220, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 8 }}>
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${theme.border}`, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11.5, color: theme.textSecondary }}>{currentUser?.email}</div>
              </div>
              {isAdmin && (
                <div onClick={onGoToAdmin} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                  Admin settings
                </div>
              )}
              <div style={{ padding: "8px 10px 4px", fontSize: 11, fontWeight: 700, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>Theme</div>
              <div style={{ display: "flex", gap: 6, padding: "2px 10px 8px" }}>
                <button
                  onClick={onSetLightTheme}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${theme.border}`, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", background: dark ? "transparent" : "#4F46E5", color: dark ? theme.textSecondary : "#fff" }}
                >
                  Light
                </button>
                <button
                  onClick={onSetDarkTheme}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${theme.border}`, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", background: dark ? "#4F46E5" : "transparent", color: dark ? "#fff" : theme.textSecondary }}
                >
                  Dark
                </button>
              </div>
              <div onClick={onLogout} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48", marginTop: 2 }}>
                Log out
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
