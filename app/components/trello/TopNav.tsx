"use client";

import { useState } from "react";
import { ArrowLeft, Lock, Monitor, Moon, MoreHorizontal, Sun } from "lucide-react";
import { useAuth } from "../../lib/trello/contexts/AuthContext";
import { useTheme } from "../../lib/trello/contexts/ThemeContext";
import { useBoards } from "../../lib/trello/contexts/BoardsContext";
import { useNavigation } from "../../lib/trello/contexts/NavigationContext";

export default function TopNav() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { currentUser, isAdmin, logout } = useAuth();
  const { boards, updateBoard, deleteBoard } = useBoards();
  const { view, activeBoardId, goToDashboard, goToAdmin, resetToRoot } = useNavigation();

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [editingBoardNameValue, setEditingBoardNameValue] = useState("");

  const dark = themeMode === "dark";
  const isLight = themeMode === "light";
  const isSystem = themeMode === "system";

  const handleGoToAdmin = () => {
    setProfileMenuOpen(false);
    goToAdmin();
  };

  const handleLogout = () => {
    logout();
    resetToRoot();
  };

  const startEditBoardName = () => {
    if (!activeBoard) return;
    setEditingBoardNameValue(activeBoard.name);
    setEditingBoardName(true);
    setBoardMenuOpen(false);
  };
  const cancelEditBoardName = () => setEditingBoardName(false);
  const confirmEditBoardName = () => {
    const name = editingBoardNameValue.trim();
    setEditingBoardName(false);
    if (!activeBoard || !name) return;
    updateBoard(activeBoard.id, { name });
  };

  const toggleLockBoard = () => {
    if (!activeBoard) return;
    setBoardMenuOpen(false);
    updateBoard(activeBoard.id, { locked: !activeBoard.locked });
  };

  const handleDeleteBoard = () => {
    if (!activeBoard) return;
    if (!window.confirm("Delete this board? This can't be undone.")) return;
    setBoardMenuOpen(false);
    goToDashboard();
    deleteBoard(activeBoard.id);
  };

  return (
    <div
      className="flex items-center shrink-0 h-14 gap-2 sm:gap-3 md:gap-[14px] px-3 sm:px-5"
      style={{ borderBottom: `1px solid ${theme.border}`, background: theme.panelBg }}
    >
      {view === "board" && activeBoard && (
        <>
          <button
            onClick={goToDashboard}
            className="shrink-0 flex items-center justify-center"
            style={{ width: 30, height: 30, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: 7, cursor: "pointer", color: theme.textSecondary }}
          >
            <ArrowLeft size={15} />
          </button>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: activeBoard.cover, flexShrink: 0 }} />
          {editingBoardName ? (
            <input
              autoFocus
              value={editingBoardNameValue}
              onChange={(e) => setEditingBoardNameValue(e.target.value)}
              onBlur={confirmEditBoardName}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmEditBoardName();
                if (e.key === "Escape") cancelEditBoardName();
              }}
              className="flex-1 min-w-0"
              style={{ fontSize: 15, fontWeight: 800, border: `1px solid #4F46E5`, borderRadius: 6, padding: "3px 6px", fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
            />
          ) : (
            <div className="truncate flex-1 min-w-0" style={{ fontSize: 15, fontWeight: 800 }}>{activeBoard.name}</div>
          )}
          {activeBoard.locked && (
            <div title="Board is locked" className="shrink-0 flex" style={{ color: theme.textSecondary }}>
              <Lock size={13} />
            </div>
          )}
          {isAdmin && !editingBoardName && (
            <div className="shrink-0 relative">
              <button
                onClick={() => setBoardMenuOpen((v) => !v)}
                title="Board options"
                className="flex items-center justify-center shrink-0"
                style={{ width: 26, height: 26, border: `1px solid ${theme.border}`, background: theme.panelBg, borderRadius: 6, cursor: "pointer", color: theme.textSecondary, fontFamily: "inherit" }}
              >
                <MoreHorizontal size={15} />
              </button>
              {boardMenuOpen && (
                <>
                  <div onClick={() => setBoardMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
                  <div style={{ position: "absolute", top: 32, left: 0, width: 180, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 6 }}>
                    <div onClick={startEditBoardName} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                      Rename board
                    </div>
                    <div onClick={toggleLockBoard} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                      {activeBoard.locked ? "Unlock board" : "Lock board"}
                    </div>
                    <div style={{ height: 1, background: theme.border, margin: "4px 2px" }} />
                    <div onClick={handleDeleteBoard} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48" }}>
                      Delete board
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
      {view === "dashboard" && <div className="truncate flex-1 min-w-0" style={{ fontSize: 15, fontWeight: 800 }}>Your boards</div>}
      {view === "admin" && <div className="truncate flex-1 min-w-0" style={{ fontSize: 15, fontWeight: 800 }}>Admin panel</div>}

      <div className="ml-auto flex items-center gap-2 sm:gap-3 relative shrink-0">
        <input
          placeholder="Search…"
          className="hidden sm:block"
          style={{ width: 180, padding: "8px 12px", border: `1px solid ${theme.border}`, borderRadius: 7, fontSize: 13, fontFamily: "inherit", background: theme.inputBg, color: theme.text }}
        />
        <div
          onClick={() => setProfileMenuOpen((v) => !v)}
          title={currentUser?.name}
          className="flex items-center justify-center shrink-0 cursor-pointer"
          style={{ width: 30, height: 30, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 12, fontWeight: 700 }}
        >
          {currentUser?.initials}
        </div>

        {profileMenuOpen && (
          <>
            <div onClick={() => setProfileMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
            <div style={{ position: "absolute", top: 40, right: 0, width: 220, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.16)", zIndex: 71, padding: 8 }}>
              <div style={{ padding: "8px 10px", borderBottom: `1px solid ${theme.border}`, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{currentUser?.name}</div>
                <div style={{ fontSize: 11.5, color: theme.textSecondary }}>{currentUser?.email}</div>
              </div>
              {isAdmin && (
                <div onClick={handleGoToAdmin} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: theme.text }}>
                  Admin settings
                </div>
              )}
              <div style={{ padding: "8px 10px 4px", fontSize: 11, fontWeight: 700, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>Theme</div>
              <div style={{ display: "flex", gap: 6, padding: "2px 10px 8px" }}>
                <button
                  onClick={() => setThemeMode("light")}
                  title="Light"
                  aria-label="Light theme"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", borderRadius: 6, border: `1px solid ${theme.border}`, cursor: "pointer", background: isLight ? "#4F46E5" : "transparent", color: isLight ? "#fff" : theme.textSecondary }}
                >
                  <Sun size={14} />
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  title="Dark"
                  aria-label="Dark theme"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", borderRadius: 6, border: `1px solid ${theme.border}`, cursor: "pointer", background: dark ? "#4F46E5" : "transparent", color: dark ? "#fff" : theme.textSecondary }}
                >
                  <Moon size={14} />
                </button>
                <button
                  onClick={() => setThemeMode("system")}
                  title="System"
                  aria-label="System theme"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", borderRadius: 6, border: `1px solid ${theme.border}`, cursor: "pointer", background: isSystem ? "#4F46E5" : "transparent", color: isSystem ? "#fff" : theme.textSecondary }}
                >
                  <Monitor size={14} />
                </button>
              </div>
              <div onClick={handleLogout} style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#E11D48", marginTop: 2 }}>
                Log out
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
